import type { Board, Piece, GameState, Move, MoveRecord, Player, Hands } from './types'
import { createHirateBoard, createEmptyHands } from './constants'

// -------------------------------------------------------
// Deep clone helpers
// -------------------------------------------------------

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)))
}

function cloneHands(hands: Hands): Hands {
  return {
    sente: { ...hands.sente },
    gote: { ...hands.gote },
  }
}

function opponent(player: Player): Player {
  return player === 'sente' ? 'gote' : 'sente'
}

// -------------------------------------------------------
// State creation
// -------------------------------------------------------

export function createInitialState(): GameState {
  return {
    board: createHirateBoard(),
    hands: createEmptyHands(),
    turn: 'sente',
    moveCount: 0,
    history: [],
  }
}

export function createStateFromData(
  board: Board,
  hands: Hands,
  turn: Player,
  moveCount: number,
): GameState {
  return { board, hands, turn, moveCount, history: [] }
}

// -------------------------------------------------------
// Apply move (returns new state — immutable)
// -------------------------------------------------------

export function applyMove(state: GameState, move: Move): GameState {
  const board = cloneBoard(state.board)
  const hands = cloneHands(state.hands)
  let captured: Piece | null = null

  if (move.type === 'move') {
    const piece = board[move.from.row]![move.from.col]!
    captured = board[move.to.row]![move.to.col] ?? null

    // Remove piece from origin
    board[move.from.row]![move.from.col] = null

    // Place piece (possibly promoted) at destination
    board[move.to.row]![move.to.col] = move.promote
      ? { ...piece, promoted: true }
      : { ...piece }

    // Add captured piece to hand (demoted)
    if (captured) {
      const hand = hands[state.turn]
      const demoted = captured.type
      hand[demoted] = (hand[demoted] || 0) + 1
    }
  } else {
    // Drop move
    board[move.to.row]![move.to.col] = {
      type: move.pieceType,
      owner: state.turn,
      promoted: false,
    }

    // Remove from hand
    const hand = hands[state.turn]
    hand[move.pieceType] = (hand[move.pieceType] || 0) - 1
    if ((hand[move.pieceType] ?? 0) <= 0) delete hand[move.pieceType]
  }

  const record: MoveRecord = { move, captured }

  return {
    board,
    hands,
    turn: opponent(state.turn),
    moveCount: state.moveCount + 1,
    history: [...state.history, record],
  }
}

// -------------------------------------------------------
// Undo move
// -------------------------------------------------------

export function undoMove(state: GameState): GameState | null {
  if (state.history.length === 0) return null

  const history = [...state.history]
  const record = history.pop()!
  const { move, captured } = record

  const board = cloneBoard(state.board)
  const hands = cloneHands(state.hands)
  const prevPlayer = opponent(state.turn) // the player who made the move

  if (move.type === 'move') {
    // Get the moved piece from destination
    const movedPiece = board[move.to.row]![move.to.col]!

    // Restore it at origin (undo promotion)
    board[move.from.row]![move.from.col] = move.promote
      ? { ...movedPiece, promoted: false }
      : { ...movedPiece }

    // Restore captured piece at destination (or set null)
    board[move.to.row]![move.to.col] = captured

    // Remove captured piece from hand
    if (captured) {
      const hand = hands[prevPlayer]
      const demoted = captured.type
      hand[demoted] = (hand[demoted] || 0) - 1
      if ((hand[demoted] ?? 0) <= 0) delete hand[demoted]
    }
  } else {
    // Undo drop: remove piece from board, add back to hand
    board[move.to.row]![move.to.col] = null
    const hand = hands[prevPlayer]
    hand[move.pieceType] = (hand[move.pieceType] || 0) + 1
  }

  return {
    board,
    hands,
    turn: prevPlayer,
    moveCount: state.moveCount - 1,
    history,
  }
}

// -------------------------------------------------------
// Replay to a specific move index
// -------------------------------------------------------

/**
 * Replay moves from an initial state up to move index N.
 * Returns the GameState after applying moves[0..n-1].
 */
export function replayToMove(initialState: GameState, moves: Move[], n: number): GameState {
  let state = initialState
  const limit = Math.min(n, moves.length)
  for (let i = 0; i < limit; i++) {
    state = applyMove(state, moves[i]!)
  }
  return state
}
