import type { Board, Piece, Position, Player } from './types'
import {
  KING_DIRS, GOLD_DIRS, SILVER_DIRS, PAWN_DIRS,
  KNIGHT_DIRS, ROOK_DIRS, BISHOP_DIRS, LANCE_DIRS,
  type Direction,
} from './constants'

function inBoard(row: number, col: number): boolean {
  return row >= 0 && row < 9 && col >= 0 && col < 9
}

// Flip direction for gote (negate dRow)
function orient(dirs: Direction[], owner: Player): Direction[] {
  if (owner === 'sente') return dirs
  return dirs.map(([dc, dr]) => [dc, -dr] as Direction)
}

// Step moves: move exactly 1 square in each direction
function getStepMoves(board: Board, pos: Position, owner: Player, dirs: Direction[]): Position[] {
  const oriented = orient(dirs, owner)
  const results: Position[] = []
  for (const [dc, dr] of oriented) {
    const nr = pos.row + dr
    const nc = pos.col + dc
    if (!inBoard(nr, nc)) continue
    const target = board[nr]![nc]
    if (target && target.owner === owner) continue // blocked by own piece
    results.push({ row: nr, col: nc })
  }
  return results
}

// Slide moves: move multiple squares in one direction until blocked
function getSlideMoves(board: Board, pos: Position, owner: Player, dirs: Direction[]): Position[] {
  const oriented = orient(dirs, owner)
  const results: Position[] = []
  for (const [dc, dr] of oriented) {
    let nr = pos.row + dr
    let nc = pos.col + dc
    while (inBoard(nr, nc)) {
      const target = board[nr]![nc]
      if (target) {
        if (target.owner !== owner) results.push({ row: nr, col: nc }) // capture
        break
      }
      results.push({ row: nr, col: nc })
      nr += dr
      nc += dc
    }
  }
  return results
}

// Knight moves: can jump over pieces
function getKnightMoves(board: Board, pos: Position, owner: Player): Position[] {
  const oriented = orient(KNIGHT_DIRS, owner)
  const results: Position[] = []
  for (const [dc, dr] of oriented) {
    const nr = pos.row + dr
    const nc = pos.col + dc
    if (!inBoard(nr, nc)) continue
    const target = board[nr]![nc]
    if (target && target.owner === owner) continue
    results.push({ row: nr, col: nc })
  }
  return results
}

/**
 * Get all squares a piece can potentially move to.
 * This does NOT check for check / self-check — that is done in rules.ts.
 */
export function getPieceMovements(board: Board, pos: Position, piece: Piece): Position[] {
  const { type, owner, promoted } = piece

  // All promoted pieces except rook/bishop move like gold
  if (promoted && type !== 'rook' && type !== 'bishop') {
    return getStepMoves(board, pos, owner, GOLD_DIRS)
  }

  switch (type) {
    case 'king':
      return getStepMoves(board, pos, owner, KING_DIRS)

    case 'rook':
      if (promoted) {
        // Dragon king: rook slides + king-like diagonal steps
        return [
          ...getSlideMoves(board, pos, owner, ROOK_DIRS),
          ...getStepMoves(board, pos, owner, BISHOP_DIRS),
        ]
      }
      return getSlideMoves(board, pos, owner, ROOK_DIRS)

    case 'bishop':
      if (promoted) {
        // Dragon horse: bishop slides + king-like orthogonal steps
        return [
          ...getSlideMoves(board, pos, owner, BISHOP_DIRS),
          ...getStepMoves(board, pos, owner, ROOK_DIRS),
        ]
      }
      return getSlideMoves(board, pos, owner, BISHOP_DIRS)

    case 'gold':
      return getStepMoves(board, pos, owner, GOLD_DIRS)

    case 'silver':
      return getStepMoves(board, pos, owner, SILVER_DIRS)

    case 'knight':
      return getKnightMoves(board, pos, owner)

    case 'lance':
      return getSlideMoves(board, pos, owner, LANCE_DIRS)

    case 'pawn':
      return getStepMoves(board, pos, owner, PAWN_DIRS)

    default:
      return []
  }
}

/**
 * Find the position of a player's king on the board.
 */
export function findKing(board: Board, player: Player): Position | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const pc = board[r]![c]
      if (pc && pc.type === 'king' && pc.owner === player) {
        return { row: r, col: c }
      }
    }
  }
  return null
}

/**
 * Check if a given square is attacked by any piece of the specified player.
 */
export function isSquareAttackedBy(board: Board, target: Position, attacker: Player): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const pc = board[r]![c]
      if (!pc || pc.owner !== attacker) continue
      const moves = getPieceMovements(board, { row: r, col: c }, pc)
      if (moves.some(m => m.row === target.row && m.col === target.col)) {
        return true
      }
    }
  }
  return false
}
