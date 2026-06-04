export interface EtiquetteCard {
  id: string
  icon: string
  title: string
  rule: string
  antiPattern: string
}

export const ETIQUETTE_CARDS: EtiquetteCard[] = [
  {
    id: 'meaningful-commits',
    icon: '📝',
    title: 'Write Meaningful Commit Messages',
    rule: 'A good commit message explains WHY a change was made, not just what changed.',
    antiPattern: '"fix stuff" or "asdf" — useless to your future self and teammates.',
  },
  {
    id: 'feature-branches',
    icon: '🌿',
    title: 'Always Work on a Feature Branch',
    rule: 'Never commit new features directly to main. Use a branch so work stays isolated until reviewed.',
    antiPattern: 'Pushing half-finished features to main breaks production for the whole team.',
  },
  {
    id: 'pull-before-push',
    icon: '⬇️',
    title: 'Pull Before You Push',
    rule: 'Always sync with the remote before pushing. Your teammates may have pushed while you were working.',
    antiPattern: 'Pushing without pulling causes rejected pushes and messy merge conflicts.',
  },
  {
    id: 'conflicts-are-normal',
    icon: '🤝',
    title: 'Conflicts Are Normal — Don\'t Panic',
    rule: 'Merge conflicts happen when two people edit the same code. Resolve them thoughtfully, not hastily.',
    antiPattern: 'Blindly accepting all incoming or discarding all current changes without reading the diff.',
  },
  {
    id: 'pull-requests',
    icon: '👁️',
    title: 'Use Pull Requests for Code Review',
    rule: 'A PR is your chance to get feedback before your code goes live. Fill in context and request a reviewer.',
    antiPattern: 'Merging your own PR immediately without review — even if "it\'s just a small change."',
  },
  {
    id: 'no-force-push',
    icon: '🚨',
    title: 'Never Force Push to Shared Branches',
    rule: 'Force pushing rewrites history and destroys teammates\' work. It\'s the git equivalent of overwriting a document everyone is editing.',
    antiPattern: 'git push --force on main. This will break your team\'s trust instantly.',
  },
]
