import * as Emoji from 'node-emoji'

export function getEmoji(name: string) {
  return Emoji.get(name) || '';
}