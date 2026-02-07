import { ref, computed } from 'vue'
import type { Position, PieceType, GameState, Move, BoardMove } from '../core/types'
import { getLegalBoardMoves, getLegalDropPositions, getPromotionStatus } from '../core/rules'

export type SelectionState =
  | { mode: 'none' }
  | { mode: 'board'; pos: Position }
  | { mode: 'hand'; pieceType: PieceType }

export function useSelection(
  getState: () => GameState,
  onMove: (move: Move) => void,
) {
  const selection = ref<SelectionState>({ mode: 'none' })
  const promotionPending = ref<{ moves: [BoardMove, BoardMove] } | null>(null)

  const legalTargets = computed<Position[]>(() => {
    const state = getState()
    const sel = selection.value
    if (sel.mode === 'board') {
      const moves = getLegalBoardMoves(state, sel.pos)
      // Deduplicate targets (promote and no-promote go to same square)
      const seen = new Set<string>()
      return moves.filter(m => {
        const key = `${m.to.row},${m.to.col}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).map(m => m.to)
    }
    if (sel.mode === 'hand') {
      return getLegalDropPositions(state, sel.pieceType)
    }
    return []
  })

  function clearSelection() {
    selection.value = { mode: 'none' }
    promotionPending.value = null
  }

  function selectBoardPiece(pos: Position) {
    const state = getState()
    const piece = state.board[pos.row]?.[pos.col]
    if (!piece || piece.owner !== state.turn) {
      clearSelection()
      return
    }
    selection.value = { mode: 'board', pos }
  }

  function selectHandPiece(pieceType: PieceType) {
    const state = getState()
    const hand = state.hands[state.turn]
    if (!hand[pieceType] || (hand[pieceType] ?? 0) <= 0) {
      clearSelection()
      return
    }
    selection.value = { mode: 'hand', pieceType }
  }

  function handleSquareClick(pos: Position) {
    const state = getState()
    const sel = selection.value

    // If promotion dialog is pending, ignore board clicks
    if (promotionPending.value) return

    if (sel.mode === 'none') {
      // Select a piece on the board
      selectBoardPiece(pos)
      return
    }

    if (sel.mode === 'board') {
      // Check if clicking own piece -> switch selection
      const clickedPiece = state.board[pos.row]?.[pos.col]
      if (clickedPiece && clickedPiece.owner === state.turn) {
        selectBoardPiece(pos)
        return
      }

      // Check if target is in legal moves
      const isLegal = legalTargets.value.some(t => t.row === pos.row && t.col === pos.col)
      if (!isLegal) {
        clearSelection()
        return
      }

      // Determine promotion
      const piece = state.board[sel.pos.row]![sel.pos.col]!
      const promStatus = getPromotionStatus(piece, sel.pos, pos)

      if (promStatus === 'mandatory') {
        onMove({ type: 'move', from: sel.pos, to: pos, promote: true })
        clearSelection()
      } else if (promStatus === 'optional') {
        // Show promotion dialog
        promotionPending.value = {
          moves: [
            { type: 'move', from: sel.pos, to: pos, promote: true },
            { type: 'move', from: sel.pos, to: pos, promote: false },
          ],
        }
      } else {
        onMove({ type: 'move', from: sel.pos, to: pos, promote: false })
        clearSelection()
      }
      return
    }

    if (sel.mode === 'hand') {
      const isLegal = legalTargets.value.some(t => t.row === pos.row && t.col === pos.col)
      if (!isLegal) {
        clearSelection()
        return
      }
      onMove({ type: 'drop', pieceType: sel.pieceType, to: pos })
      clearSelection()
    }
  }

  function handleHandClick(pieceType: PieceType) {
    if (promotionPending.value) return
    const sel = selection.value
    if (sel.mode === 'hand' && sel.pieceType === pieceType) {
      clearSelection()
      return
    }
    selectHandPiece(pieceType)
  }

  function resolvePromotion(promote: boolean) {
    if (!promotionPending.value) return
    const move = promote ? promotionPending.value.moves[0] : promotionPending.value.moves[1]
    onMove(move)
    clearSelection()
  }

  return {
    selection,
    legalTargets,
    promotionPending,
    handleSquareClick,
    handleHandClick,
    resolvePromotion,
    clearSelection,
  }
}
