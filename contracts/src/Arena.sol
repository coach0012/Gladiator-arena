// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Arena
/// @notice Records AI agent battle results on-chain for Gladiator Arena.
/// Full battle logs and agent data live on 0G Storage; this contract
/// stores just enough to make outcomes verifiable and tamper-proof.
contract Arena {
    struct Agent {
        address owner;
        string name;
        string storageHash; // 0G Storage hash pointing to full agent data
        uint256 wins;
        uint256 losses;
        bool exists;
    }

    struct BattleResult {
        bytes32 agentA;
        bytes32 agentB;
        bytes32 winner;
        string storageHash; // 0G Storage hash pointing to full battle log
        uint256 timestamp;
    }

    mapping(bytes32 => Agent) public agents;
    mapping(bytes32 => BattleResult) public battles;
    bytes32[] public battleIds;

    address public owner;

    event AgentRegistered(bytes32 indexed agentId, address indexed owner, string name);
    event BattleRecorded(bytes32 indexed battleId, bytes32 winner, string storageHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Arena: caller is not the contract owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Registers a new agent on-chain. Anyone can register their own agent.
    /// @param agentId A unique identifier for the agent (e.g. keccak256 of its backend UUID)
    /// @param name Display name of the agent
    /// @param storageHash 0G Storage hash where the full agent data is stored
    function registerAgent(bytes32 agentId, string calldata name, string calldata storageHash) external {
        require(!agents[agentId].exists, "Arena: agent already registered");

        agents[agentId] = Agent({
            owner: msg.sender,
            name: name,
            storageHash: storageHash,
            wins: 0,
            losses: 0,
            exists: true
        });

        emit AgentRegistered(agentId, msg.sender, name);
    }

    /// @notice Records the result of a completed battle.
    /// @dev In this first version, only the contract owner (your backend's
    /// wallet) can record results, to prevent spam/fake results. You can
    /// loosen this later with signature verification.
    function recordBattle(
        bytes32 battleId,
        bytes32 agentA,
        bytes32 agentB,
        bytes32 winner,
        string calldata storageHash
    ) external onlyOwner {
        require(agents[agentA].exists, "Arena: agentA not registered");
        require(agents[agentB].exists, "Arena: agentB not registered");
        require(
            winner == agentA || winner == agentB || winner == bytes32(0),
            "Arena: winner must be agentA, agentB, or zero for a draw"
        );

        battles[battleId] = BattleResult({
            agentA: agentA,
            agentB: agentB,
            winner: winner,
            storageHash: storageHash,
            timestamp: block.timestamp
        });
        battleIds.push(battleId);

        if (winner == agentA) {
            agents[agentA].wins += 1;
            agents[agentB].losses += 1;
        } else if (winner == agentB) {
            agents[agentB].wins += 1;
            agents[agentA].losses += 1;
        }

        emit BattleRecorded(battleId, winner, storageHash);
    }

    function getAgent(bytes32 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    function getBattle(bytes32 battleId) external view returns (BattleResult memory) {
        return battles[battleId];
    }

    function totalBattles() external view returns (uint256) {
        return battleIds.length;
    }
}

