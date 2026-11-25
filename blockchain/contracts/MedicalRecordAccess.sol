// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MedicalRecordAccess
 * @notice Smart contract for decentralized, patient-controlled Electronic Medical Record (EMR) access management.
 * @dev Only record identifiers and SHA-256 cryptographic hashes are stored on-chain.
 *      Actual medical files and private data are encrypted and stored off-chain.
 */
contract MedicalRecordAccess {
    enum Role {
        NONE,
        PATIENT,
        DOCTOR,
        HOSPITAL,
        ADMIN
    }

    struct User {
        Role role;
        string name;
        bool isActive;
        uint256 registeredAt;
    }

    struct Record {
        string recordId;
        address patient;
        string fileHash; // SHA-256 hash of original document
        string category;
        uint256 createdAt;
        bool exists;
    }

    struct AccessPermission {
        bool isGranted;
        uint256 expiryTimestamp; // Unix timestamp in seconds (0 = no expiration)
        uint256 grantedAt;
    }

    address public admin;

    // Address to User details
    mapping(address => User) public users;

    // Record ID to Record details
    mapping(string => Record) private records;

    // Patient address to array of record IDs
    mapping(address => string[]) private patientRecordIds;

    // keccak256(abi.encodePacked(patient, requester, recordId)) => AccessPermission
    mapping(bytes32 => AccessPermission) private permissions;

    // Registered user address lists for UI discovery
    address[] public patientAddresses;
    address[] public doctorAddresses;
    address[] public hospitalAddresses;

    // --- EVENTS ---
    event UserRegistered(
        address indexed userAddress,
        uint8 indexed role,
        string name,
        uint256 timestamp
    );
    event RecordAdded(
        address indexed patient,
        string recordId,
        string fileHash,
        string category,
        uint256 timestamp
    );
    event AccessGranted(
        address indexed patient,
        address indexed requester,
        string recordId,
        uint256 expiryTimestamp,
        uint256 timestamp
    );
    event AccessRevoked(
        address indexed patient,
        address indexed requester,
        string recordId,
        uint256 timestamp
    );
    event RecordAccessed(
        address indexed patient,
        address indexed accessor,
        string recordId,
        uint256 timestamp
    );

    // --- MODIFIERS ---
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyPatient() {
        require(users[msg.sender].role == Role.PATIENT, "Only registered patients can perform this action");
        require(users[msg.sender].isActive, "Patient account is inactive");
        _;
    }

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid zero address");
        _;
    }

    modifier onlyRecordOwner(string memory _recordId) {
        require(records[_recordId].exists, "Record does not exist");
        require(records[_recordId].patient == msg.sender, "You are not the owner of this record");
        _;
    }

    constructor() {
        admin = msg.sender;
        users[msg.sender] = User({
            role: Role.ADMIN,
            name: "System Administrator",
            isActive: true,
            registeredAt: block.timestamp
        });
        emit UserRegistered(msg.sender, uint8(Role.ADMIN), "System Administrator", block.timestamp);
    }

    // --- USER REGISTRATION ---

    /**
     * @notice Self-registration for patients.
     * @param _name Name of the patient.
     */
    function registerPatient(string memory _name) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(users[msg.sender].role == Role.NONE, "Address already registered");

        users[msg.sender] = User({
            role: Role.PATIENT,
            name: _name,
            isActive: true,
            registeredAt: block.timestamp
        });

        patientAddresses.push(msg.sender);
        emit UserRegistered(msg.sender, uint8(Role.PATIENT), _name, block.timestamp);
    }

    /**
     * @notice Admin registers a verified doctor.
     * @param _doctor Address of the doctor.
     * @param _name Name of the doctor.
     */
    function registerDoctor(address _doctor, string memory _name)
        external
        onlyAdmin
        validAddress(_doctor)
    {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(users[_doctor].role == Role.NONE, "Address already registered");

        users[_doctor] = User({
            role: Role.DOCTOR,
            name: _name,
            isActive: true,
            registeredAt: block.timestamp
        });

        doctorAddresses.push(_doctor);
        emit UserRegistered(_doctor, uint8(Role.DOCTOR), _name, block.timestamp);
    }

    /**
     * @notice Admin registers a verified hospital.
     * @param _hospital Address of the hospital.
     * @param _name Name of the hospital.
     */
    function registerHospital(address _hospital, string memory _name)
        external
        onlyAdmin
        validAddress(_hospital)
    {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(users[_hospital].role == Role.NONE, "Address already registered");

        users[_hospital] = User({
            role: Role.HOSPITAL,
            name: _name,
            isActive: true,
            registeredAt: block.timestamp
        });

        hospitalAddresses.push(_hospital);
        emit UserRegistered(_hospital, uint8(Role.HOSPITAL), _name, block.timestamp);
    }

    // --- MEDICAL RECORD MANAGEMENT ---

    /**
     * @notice Registers a new medical record cryptographic reference on-chain.
     * @param _recordId Unique record ID generated off-chain.
     * @param _fileHash SHA-256 hash of the unencrypted original document.
     * @param _category Medical category (e.g. Lab Report, Prescription).
     */
    function addRecord(
        string memory _recordId,
        string memory _fileHash,
        string memory _category
    ) external onlyPatient {
        require(bytes(_recordId).length > 0, "Record ID cannot be empty");
        require(bytes(_fileHash).length > 0, "File hash cannot be empty");
        require(!records[_recordId].exists, "Record ID already exists");

        records[_recordId] = Record({
            recordId: _recordId,
            patient: msg.sender,
            fileHash: _fileHash,
            category: _category,
            createdAt: block.timestamp,
            exists: true
        });

        patientRecordIds[msg.sender].push(_recordId);

        emit RecordAdded(msg.sender, _recordId, _fileHash, _category, block.timestamp);
    }

    // --- ACCESS CONTROL ---

    /**
     * @dev Generates hash key for mapping lookup.
     */
    function getPermissionKey(
        address _patient,
        address _requester,
        string memory _recordId
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_patient, _requester, _recordId));
    }

    /**
     * @notice Patient grants access for a record to a doctor or hospital.
     * @param _requester Wallet address of doctor or hospital.
     * @param _recordId The ID of the record being shared.
     * @param _expiryTimestamp Unix timestamp when access expires (0 for indefinite).
     */
    function grantAccess(
        address _requester,
        string memory _recordId,
        uint256 _expiryTimestamp
    ) external onlyRecordOwner(_recordId) validAddress(_requester) {
        require(
            users[_requester].role == Role.DOCTOR || users[_requester].role == Role.HOSPITAL,
            "Requester must be a registered doctor or hospital"
        );
        require(
            _expiryTimestamp == 0 || _expiryTimestamp > block.timestamp,
            "Expiry timestamp must be in the future"
        );

        bytes32 key = getPermissionKey(msg.sender, _requester, _recordId);
        permissions[key] = AccessPermission({
            isGranted: true,
            expiryTimestamp: _expiryTimestamp,
            grantedAt: block.timestamp
        });

        emit AccessGranted(msg.sender, _requester, _recordId, _expiryTimestamp, block.timestamp);
    }

    /**
     * @notice Patient revokes access from a doctor or hospital for a record.
     * @param _requester Wallet address of doctor or hospital.
     * @param _recordId The ID of the record.
     */
    function revokeAccess(address _requester, string memory _recordId)
        external
        onlyRecordOwner(_recordId)
        validAddress(_requester)
    {
        bytes32 key = getPermissionKey(msg.sender, _requester, _recordId);
        require(permissions[key].isGranted, "Permission not granted or already revoked");

        permissions[key].isGranted = false;

        emit AccessRevoked(msg.sender, _requester, _recordId, block.timestamp);
    }

    /**
     * @notice Verifies whether a requester has valid, active, non-expired permission to access a record.
     * @param _patient Patient wallet address.
     * @param _requester Doctor, hospital, or patient wallet address.
     * @param _recordId The record ID.
     */
    function hasValidAccess(
        address _patient,
        address _requester,
        string memory _recordId
    ) public view returns (bool) {
        // Patient always has access to their own record
        if (_requester == _patient) {
            return records[_recordId].exists && records[_recordId].patient == _patient;
        }

        if (!records[_recordId].exists) {
            return false;
        }

        bytes32 key = getPermissionKey(_patient, _requester, _recordId);
        AccessPermission memory perm = permissions[key];

        if (!perm.isGranted) {
            return false;
        }

        // Check expiration
        if (perm.expiryTimestamp != 0 && block.timestamp >= perm.expiryTimestamp) {
            return false;
        }

        return true;
    }

    /**
     * @notice Logs a record access on the blockchain. Emits an audit event.
     * @param _patient The patient whose record is accessed.
     * @param _recordId The record accessed.
     */
    function logRecordAccess(address _patient, string memory _recordId) external {
        require(
            hasValidAccess(_patient, msg.sender, _recordId),
            "Caller does not have valid access permission"
        );

        emit RecordAccessed(_patient, msg.sender, _recordId, block.timestamp);
    }

    // --- VIEW HELPERS ---

    function getUser(address _user)
        external
        view
        returns (
            Role role,
            string memory name,
            bool isActive,
            uint256 registeredAt
        )
    {
        User memory u = users[_user];
        return (u.role, u.name, u.isActive, u.registeredAt);
    }

    function getRecord(string memory _recordId)
        external
        view
        returns (
            string memory recordId,
            address patient,
            string memory fileHash,
            string memory category,
            uint256 createdAt,
            bool exists
        )
    {
        Record memory r = records[_recordId];
        return (r.recordId, r.patient, r.fileHash, r.category, r.createdAt, r.exists);
    }

    function getPatientRecordIds(address _patient)
        external
        view
        returns (string[] memory)
    {
        return patientRecordIds[_patient];
    }

    function getAccessPermission(
        address _patient,
        address _requester,
        string memory _recordId
    )
        external
        view
        returns (
            bool isGranted,
            uint256 expiryTimestamp,
            uint256 grantedAt
        )
    {
        bytes32 key = getPermissionKey(_patient, _requester, _recordId);
        AccessPermission memory p = permissions[key];
        return (p.isGranted, p.expiryTimestamp, p.grantedAt);
    }

    function getRegisteredDoctors() external view returns (address[] memory) {
        return doctorAddresses;
    }

    function getRegisteredHospitals() external view returns (address[] memory) {
        return hospitalAddresses;
    }

    function getRegisteredPatients() external view returns (address[] memory) {
        return patientAddresses;
    }
}
