from pydantic import BaseModel, Field, ValidationError, field_validator
from typing import List, Optional, Dict, Any
import json
import hashlib
import requests
from datetime import datetime
import os

# Pydantic Models for Dataset Validation
class DatasetRow(BaseModel):
    site_id: str = Field(..., min_length=1, max_length=50)
    habitat_type: str = Field(..., pattern=r'^(mangrove|seagrass|saltmarsh|kelp_forest)$')
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    area_hectares: float = Field(..., gt=0)
    carbon_stock_tonnes_per_hectare: float = Field(..., ge=0)
    measurement_date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    uncertainty_percent: Optional[float] = Field(None, ge=0, le=100)

    @field_validator('measurement_date')
    @classmethod
    def validate_date(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('Invalid date format. Use YYYY-MM-DD')

class MRVReport(BaseModel):
    project_id: str
    report_id: str
    timestamp: str
    validated_data: List[DatasetRow]
    sequestration_calculation: Dict[str, Any]
    uncertainty_band: Dict[str, float]
    ipfs_hash: str
    json_ld: Dict[str, Any]

# IPCC Emission Factors (simplified for blue carbon habitats)
IPCC_FACTORS = {
    'mangrove': {'sequestration_rate': 2.5, 'uncertainty': 0.3},  # tonnes CO2/ha/year
    'seagrass': {'sequestration_rate': 1.8, 'uncertainty': 0.25},
    'saltmarsh': {'sequestration_rate': 2.2, 'uncertainty': 0.35},
    'kelp_forest': {'sequestration_rate': 1.5, 'uncertainty': 0.2}
}

def validate_dataset(data: List[Dict[str, Any]]) -> List[DatasetRow]:
    """Validate each row in the dataset using Pydantic."""
    validated_rows = []
    errors = []

    for i, row in enumerate(data):
        try:
            validated_row = DatasetRow(**row)
            validated_rows.append(validated_row)
        except ValidationError as e:
            errors.append(f"Row {i+1}: {e}")

    if errors:
        raise ValueError(f"Validation errors: {'; '.join(errors)}")

    return validated_rows

def calculate_mrv(validated_data: List[DatasetRow]) -> Dict[str, Any]:
    """Perform MRV computation using IPCC factors."""
    total_sequestration = 0
    total_uncertainty = 0
    habitat_breakdown = {}

    for row in validated_data:
        habitat = row.habitat_type
        area = row.area_hectares
        rate = IPCC_FACTORS[habitat]['sequestration_rate']
        uncertainty = IPCC_FACTORS[habitat]['uncertainty']

        sequestration = area * rate
        total_sequestration += sequestration

        # Calculate uncertainty band
        uncertainty_amount = sequestration * uncertainty
        total_uncertainty += uncertainty_amount

        if habitat not in habitat_breakdown:
            habitat_breakdown[habitat] = {'sequestration': 0, 'uncertainty': 0}
        habitat_breakdown[habitat]['sequestration'] += sequestration
        habitat_breakdown[habitat]['uncertainty'] += uncertainty_amount

    return {
        'total_sequestration_tonnes_co2': total_sequestration,
        'total_uncertainty_tonnes_co2': total_uncertainty,
        'habitat_breakdown': habitat_breakdown,
        'calculation_method': 'IPCC Tier 1 methodology for blue carbon habitats'
    }

def create_json_ld_report(report_data: MRVReport) -> Dict[str, Any]:
    """Create JSON-LD report."""
    return {
        "@context": {
            "@vocab": "https://w3id.org/carbon/",
            "project": "https://w3id.org/carbon/project/",
            "mrv": "https://w3id.org/carbon/mrv/",
            "ipfs": "https://w3id.org/ipfs/"
        },
        "@type": "MRVReport",
        "project_id": report_data.project_id,
        "report_id": report_data.report_id,
        "timestamp": report_data.timestamp,
        "validated_data": [row.model_dump() for row in report_data.validated_data],
        "sequestration_calculation": report_data.sequestration_calculation,
        "uncertainty_band": report_data.uncertainty_band,
        "ipfs_hash": report_data.ipfs_hash
    }

def hash_and_pin_to_ipfs(json_ld_data: Dict[str, Any]) -> str:
    """Hash the JSON-LD data and pin to IPFS."""
    # Serialize to JSON
    json_str = json.dumps(json_ld_data, sort_keys=True)
    
    # Hash the data
    hash_obj = hashlib.sha256(json_str.encode())
    data_hash = hash_obj.hexdigest()
    
    # Pin to IPFS (using Pinata API)
    pinata_api_key = os.getenv('PINATA_API_KEY')
    pinata_secret_key = os.getenv('PINATA_SECRET_API_KEY')
    
    if not pinata_api_key or not pinata_secret_key:
        # For testing, return the hash without pinning
        return f"test_hash_{data_hash[:16]}"
    
    url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
    headers = {
        'pinata_api_key': pinata_api_key,
        'pinata_secret_api_key': pinata_secret_key,
        'Content-Type': 'application/json'
    }
    
    payload = {
        'pinataContent': json_ld_data,
        'pinataMetadata': {
            'name': f'MRV_Report_{data_hash[:8]}'
        }
    }
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    ipfs_hash = response.json()['IpfsHash']
    return ipfs_hash

def process_dataset(project_id: str, raw_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Main processing function."""
    try:
        # Step 1: Validate data
        validated_data = validate_dataset(raw_data)
        
        # Step 2: Calculate MRV
        mrv_calculation = calculate_mrv(validated_data)
        
        # Step 3: Create report
        report_id = f"{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        timestamp = datetime.now().isoformat()
        
        uncertainty_band = {
            'lower_bound': mrv_calculation['total_sequestration_tonnes_co2'] - mrv_calculation['total_uncertainty_tonnes_co2'],
            'upper_bound': mrv_calculation['total_sequestration_tonnes_co2'] + mrv_calculation['total_uncertainty_tonnes_co2']
        }
        
        # Create initial report (without IPFS hash yet)
        report_data = MRVReport(
            project_id=project_id,
            report_id=report_id,
            timestamp=timestamp,
            validated_data=validated_data,
            sequestration_calculation=mrv_calculation,
            uncertainty_band=uncertainty_band,
            ipfs_hash="",  # Will be set after pinning
            json_ld={}
        )
        
        # Step 4: Create JSON-LD
        json_ld = create_json_ld_report(report_data)
        
        # Step 5: Hash and pin to IPFS
        ipfs_hash = hash_and_pin_to_ipfs(json_ld)
        
        # Update report with IPFS hash
        report_data.ipfs_hash = ipfs_hash
        json_ld['ipfs_hash'] = ipfs_hash
        
        return {
            'success': True,
            'report_id': report_id,
            'ipfs_hash': ipfs_hash,
            'sequestration_total': mrv_calculation['total_sequestration_tonnes_co2'],
            'uncertainty_range': uncertainty_band,
            'validated_rows': len(validated_data),
            'json_ld': json_ld
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) != 3:
        print(json.dumps({'success': False, 'error': 'Usage: python mrv_processor.py <project_id> <data_file>'}))
        sys.exit(1)
    
    project_id = sys.argv[1]
    data_file = sys.argv[2]
    
    try:
        with open(data_file, 'r') as f:
            raw_data = json.load(f)
        
        result = process_dataset(project_id, raw_data)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))