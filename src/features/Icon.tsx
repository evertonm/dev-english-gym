import { ic } from '../gym/icons'

// React wrapper for the inline Tabler icons (static, trusted markup).
export function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={'tiw' + (className ? ' ' + className : '')} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ic(name) }} />
}
