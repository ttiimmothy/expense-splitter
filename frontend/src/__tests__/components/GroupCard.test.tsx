import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import GroupCard from '../../components/GroupCard'

const mockGroup = {
  id: '1',
  name: 'Trip to Japan',
  currency: 'USD',
  createdAt: '2024-01-01T00:00:00Z',
  members: [
    {
      id: '1',
      role: 'OWNER',
      user: {
        id: '1',
        name: 'Alice',
        email: 'alice@example.com',
        avatarUrl: undefined,
      },
    },
    {
      id: '2',
      role: 'MEMBER',
      user: {
        id: '2',
        name: 'Bob',
        email: 'bob@example.com',
        avatarUrl: undefined,
      },
    },
  ],
  _count: {
    expenses: 5,
    members: 2,
  },
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('GroupCard', () => {
  it('renders group information correctly', () => {
    renderWithRouter(<GroupCard group={mockGroup} />)
    
    expect(screen.getByText('Trip to Japan')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('2 members')).toBeInTheDocument()
    expect(screen.getByText('5 expenses')).toBeInTheDocument()
  })

  it('displays member avatars', () => {
    renderWithRouter(<GroupCard group={mockGroup} />)
    
    expect(screen.getByText('A')).toBeInTheDocument() // Alice's initial
    expect(screen.getByText('B')).toBeInTheDocument() // Bob's initial
  })

  it('links to the correct group page', () => {
    renderWithRouter(<GroupCard group={mockGroup} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/groups/1')
  })

  it('shows correct member count', () => {
    const groupWithManyMembers = {
      ...mockGroup,
      members: Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        role: 'MEMBER',
        user: {
          id: `${i + 1}`,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
        },
      })),
      _count: { ...mockGroup._count, members: 5 },
    }

    renderWithRouter(<GroupCard group={groupWithManyMembers} />)
    
    expect(screen.getByText('5 members')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument() // Shows overflow count
  })
})
