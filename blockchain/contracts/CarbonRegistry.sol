// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CarbonRegistry {

    struct Project {
        uint id;
        string projectName;
        string ipfsHash;
        address owner;
        bool verified;
    }

    uint public projectCount = 0;
    mapping(uint => Project) public projects;

    event ProjectRegistered(uint id, string ipfsHash, address owner);
    event ProjectVerified(uint id);

    function registerProject(string memory _name, string memory _ipfsHash) public {
        projectCount++;

        projects[projectCount] = Project(
            projectCount,
            _name,
            _ipfsHash,
            msg.sender,
            false
        );

        emit ProjectRegistered(projectCount, _ipfsHash, msg.sender);
    }

    function verifyProject(uint _id) public {
        projects[_id].verified = true;
        emit ProjectVerified(_id);
    }

    function getProject(uint _id) public view returns (
        uint, string memory, string memory, address, bool
    ) {
        Project memory p = projects[_id];
        return (p.id, p.projectName, p.ipfsHash, p.owner, p.verified);
    }
}