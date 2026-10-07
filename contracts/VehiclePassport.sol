// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VehiclePassport {
    struct Reading {
        uint256 km;
        address issuer;
        uint64 timestamp;
        bytes32 evidenceHash;
        bool flagged;
        bool isCorrection;
        uint256 correctsIndex;
    }

    mapping(address => bool) public approved;
    mapping(address => string) public issuerName;
    mapping(bytes32 => Reading[]) private timelines;
    mapping(bytes32 => uint256) public maxKm;

    event ReadingAdded(bytes32 indexed vinHash, uint256 indexed index, uint256 km, address issuer, bool flagged);
    event CorrectionAdded(bytes32 indexed vinHash, uint256 indexed index, uint256 correctsIndex, uint256 km, address issuer);

    constructor(address[] memory issuers, string[] memory names) {
        require(issuers.length == names.length, "length mismatch");
        for (uint256 i = 0; i < issuers.length; i++) {
            approved[issuers[i]] = true;
            issuerName[issuers[i]] = names[i];
        }
    }

    modifier onlyIssuer() {
        require(approved[msg.sender], "Not an approved issuer");
        _;
    }

    function addReading(bytes32 vinHash, uint256 km, bytes32 evidenceHash) external onlyIssuer {
        bool flagged = km < maxKm[vinHash];
        if (!flagged) maxKm[vinHash] = km;
        timelines[vinHash].push(
            Reading(km, msg.sender, uint64(block.timestamp), evidenceHash, flagged, false, 0)
        );
        emit ReadingAdded(vinHash, timelines[vinHash].length - 1, km, msg.sender, flagged);
    }

    function addCorrection(bytes32 vinHash, uint256 originalIndex, uint256 km, bytes32 evidenceHash) external onlyIssuer {
        require(originalIndex < timelines[vinHash].length, "No such entry");
        timelines[vinHash].push(
            Reading(km, msg.sender, uint64(block.timestamp), evidenceHash, false, true, originalIndex)
        );
        emit CorrectionAdded(vinHash, timelines[vinHash].length - 1, originalIndex, km, msg.sender);
    }

    function getTimeline(bytes32 vinHash) external view returns (Reading[] memory) {
        return timelines[vinHash];
    }
}