import type { GameState, Move, Player, PieceType, Position } from './types'
import { createHirateBoard, createEmptyHands } from './constants'
import { applyMove, createStateFromData } from './game'

// -------------------------------------------------------
// KIF metadata
// -------------------------------------------------------

export interface KifMetadata {
  startDate?: string
  endDate?: string
  event?: string
  strategy?: string
  handicap?: string
  senteName?: string
  goteName?: string
  result?: string
}

// -------------------------------------------------------
// Constants for KIF formatting
// -------------------------------------------------------

const ZENKAKU_NUMS = ['１', '２', '３', '４', '５', '６', '７', '８', '９']
const KANJI_NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
// KIF piece name for moves (use the name BEFORE promotion)
const KIF_PIECE_NAME: Record<PieceType, { normal: string; promoted: string }> = {
  king:   { normal: '玉', promoted: '' },
  rook:   { normal: '飛', promoted: '龍' },
  bishop: { normal: '角', promoted: '馬' },
  gold:   { normal: '金', promoted: '' },
  silver: { normal: '銀', promoted: '成銀' },
  knight: { normal: '桂', promoted: '成桂' },
  lance:  { normal: '香', promoted: '成香' },
  pawn:   { normal: '歩', promoted: 'と' },
}

// -------------------------------------------------------
// Position <-> KIF notation
// -------------------------------------------------------

function posToKif(pos: Position): string {
  const file = 9 - pos.col // 1-9
  const rank = pos.row      // 0-8
  return `${ZENKAKU_NUMS[file - 1]}${KANJI_NUMS[rank]}`
}

function posToOrigin(pos: Position): string {
  const file = 9 - pos.col
  const rank = pos.row + 1
  return `(${file}${rank})`
}

// -------------------------------------------------------
// GameState -> KIF string
// -------------------------------------------------------

export function toKif(state: GameState, metadata?: KifMetadata): string {
  const lines: string[] = []

  // Header
  if (metadata?.startDate) lines.push(`開始日時：${metadata.startDate}`)
  if (metadata?.endDate) lines.push(`終了日時：${metadata.endDate}`)
  if (metadata?.event) lines.push(`棋戦：${metadata.event}`)
  if (metadata?.strategy) lines.push(`戦型：${metadata.strategy}`)
  lines.push(`手合割：${metadata?.handicap || '平手'}`)
  if (metadata?.senteName) lines.push(`先手：${metadata.senteName}`)
  if (metadata?.goteName) lines.push(`後手：${metadata.goteName}`)

  lines.push('手数----指手---------消費時間--')

  // Replay moves to generate KIF notation
  let prevTo: Position | null = null
  for (let i = 0; i < state.history.length; i++) {
    const record = state.history[i]!
    const move = record.move
    const moveNum = i + 1

    let moveStr = ''
    if (move.type === 'move') {
      // Destination
      const isSame = prevTo && prevTo.row === move.to.row && prevTo.col === move.to.col
      const destStr = isSame ? '同　' : posToKif(move.to)

      // Find the piece that was at the origin at this point
      // We use the captured info + current move to determine the piece
      // Since we track history, we reconstruct piece type from move
      // We need to replay to know what piece was moved. For simplicity,
      // we record the piece info from the board state at that move.
      // Actually, we can determine the piece from the history by replaying.
      // Let's rebuild from initial state.
      const pieceName = getPieceNameForHistory(state, i)
      const promoteStr = move.promote ? '成' : ''
      // Check if promotion was optional but declined
      const declineStr = (!move.promote && shouldShowFunari(state, i)) ? '不成' : ''
      const origin = posToOrigin(move.from)

      moveStr = `${destStr}${pieceName}${promoteStr}${declineStr}${origin}`
    } else {
      // Drop
      const destStr = posToKif(move.to)
      const name = KIF_PIECE_NAME[move.pieceType].normal
      moveStr = `${destStr}${name}打`
    }

    const numStr = String(moveNum).padStart(4, ' ')
    lines.push(`${numStr} ${moveStr}`)

    prevTo = move.to
  }

  // Result
  if (metadata?.result) {
    const numStr = String(state.history.length + 1).padStart(4, ' ')
    lines.push(`${numStr} ${metadata.result}`)
    const winner = state.turn === 'sente' ? '後手' : '先手'
    lines.push(`まで${state.history.length}手で${winner}の勝ち`)
  }

  return lines.join('\n')
}

// Replay state up to move index to get the piece that was moved
function getPieceNameForHistory(state: GameState, moveIndex: number): string {
  // Rebuild board up to the move
  let s = createStateFromData(createHirateBoard(), createEmptyHands(), 'sente', 0)
  for (let i = 0; i < moveIndex; i++) {
    s = applyMove(s, state.history[i]!.move)
  }
  const move = state.history[moveIndex]!.move
  if (move.type !== 'move') return ''
  const piece = s.board[move.from.row]![move.from.col]
  if (!piece) return ''
  if (piece.promoted) {
    return KIF_PIECE_NAME[piece.type].promoted
  }
  return KIF_PIECE_NAME[piece.type].normal
}

// Check if the move was in a situation where promotion was optional
function shouldShowFunari(state: GameState, moveIndex: number): boolean {
  let s = createStateFromData(createHirateBoard(), createEmptyHands(), 'sente', 0)
  for (let i = 0; i < moveIndex; i++) {
    s = applyMove(s, state.history[i]!.move)
  }
  const move = state.history[moveIndex]!.move
  if (move.type !== 'move') return false
  const piece = s.board[move.from.row]![move.from.col]
  if (!piece || piece.promoted) return false

  const isInEnemyZone = (row: number, owner: Player) =>
    owner === 'sente' ? row <= 2 : row >= 6
  return isInEnemyZone(move.to.row, piece.owner) || isInEnemyZone(move.from.row, piece.owner)
}

// -------------------------------------------------------
// KIF string -> GameState
// -------------------------------------------------------

export function parseKif(kif: string): { state: GameState; metadata: KifMetadata } {
  const lines = kif.split(/\r?\n/)
  const metadata: KifMetadata = {}
  let state = createStateFromData(createHirateBoard(), createEmptyHands(), 'sente', 0)
  let prevTo: Position | null = null
  let inMoves = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith('*')) continue

    // Header parsing
    if (!inMoves) {
      if (line.startsWith('手数')) {
        inMoves = true
        continue
      }
      parseHeaderLine(line, metadata)
      continue
    }

    // Move parsing
    const move = parseMoveLineToMove(line, state, prevTo)
    if (!move) {
      // Could be result line like "投了" or "まで..."
      if (line.includes('投了') || line.includes('詰み') || line.includes('中断') || line.includes('千日手')) {
        metadata.result = line.replace(/^\s*\d+\s*/, '')
      }
      continue
    }

    prevTo = move.to
    state = applyMove(state, move)
  }

  return { state, metadata }
}

function parseHeaderLine(line: string, metadata: KifMetadata): void {
  const match = line.match(/^(.+?)：(.+)$/)
  if (!match) return
  const key = match[1]!
  const value = match[2]!
  switch (key) {
    case '開始日時': metadata.startDate = value; break
    case '終了日時': metadata.endDate = value; break
    case '棋戦': metadata.event = value; break
    case '戦型': metadata.strategy = value; break
    case '手合割': metadata.handicap = value; break
    case '先手': case '下手': metadata.senteName = value; break
    case '後手': case '上手': metadata.goteName = value; break
  }
}

function parseMoveLineToMove(line: string, _state: GameState, prevTo: Position | null): Move | null {
  // Match: [number] [move content]
  // Time info like (00:01/00:05:23) may follow, but origin (xy) must be preserved
  const match = line.match(/^\s*(\d+)\s+(.+?)\s*$/)
  if (!match) return null

  const moveStr = match[2]!.trim()

  // Check for game-end markers
  if (['投了', '中断', '千日手', '持将棋', '詰み', '反則勝ち', '反則負け'].includes(moveStr)) {
    return null
  }

  // Parse drop: e.g. "４五角打"
  if (moveStr.includes('打')) {
    const dropMatch = moveStr.match(/^(.)(.)(.+)打/)
    if (!dropMatch) return null
    const to = parseKifPosition(dropMatch[1]!, dropMatch[2]!)
    if (!to) return null
    const pieceName = dropMatch[3]!
    const pieceType = kifNameToPieceType(pieceName, false)
    if (!pieceType) return null
    return { type: 'drop', pieceType, to }
  }

  // Parse board move
  let to: Position | null = null
  let rest = moveStr

  // Check for "同" (same square as previous move)
  if (rest.startsWith('同')) {
    if (!prevTo) return null
    to = prevTo
    rest = rest.replace(/^同\s*/, '')
  } else {
    // Parse destination: full-width number + kanji number
    const destMatch = rest.match(/^(.)(.)\s*/)
    if (!destMatch) return null
    to = parseKifPosition(destMatch[1]!, destMatch[2]!)
    if (!to) return null
    rest = rest.slice(destMatch[0].length)
  }

  // Parse piece name and promotion
  const promote = rest.includes('成') && !rest.includes('不成') && !rest.startsWith('成')

  // Extract origin from parentheses
  const originMatch = rest.match(/\((\d)(\d)\)/)
  if (!originMatch) return null
  const fromFile = parseInt(originMatch[1]!, 10)
  const fromRank = parseInt(originMatch[2]!, 10)
  const from: Position = { row: fromRank - 1, col: 9 - fromFile }

  return { type: 'move', from, to, promote }
}

function parseKifPosition(fileChar: string, rankChar: string): Position | null {
  const fileIdx = ZENKAKU_NUMS.indexOf(fileChar)
  if (fileIdx < 0) return null
  const rankIdx = KANJI_NUMS.indexOf(rankChar)
  if (rankIdx < 0) return null
  const file = fileIdx + 1 // 1-9
  return { row: rankIdx, col: 9 - file }
}

function kifNameToPieceType(name: string, promoted: boolean): PieceType | null {
  for (const [type, display] of Object.entries(KIF_PIECE_NAME)) {
    if (promoted && display.promoted === name) return type as PieceType
    if (!promoted && display.normal === name) return type as PieceType
  }
  // Try promoted names for unpromoted lookup (e.g. "龍" -> rook promoted)
  for (const [type, display] of Object.entries(KIF_PIECE_NAME)) {
    if (display.promoted === name) return type as PieceType
    if (display.normal === name) return type as PieceType
  }
  return null
}
