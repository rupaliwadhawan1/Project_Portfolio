import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsCard } from '../../components/MetricsCard';
import { Wind } from 'lucide-react';

describe('MetricsCard', () => {
  it('renders title and value correctly', () => {
    render(
      <MetricsCard
        title="Air Quality Index"
        value="42"
        icon={<Wind data-testid="wind-icon" />}
      />
    );

    expect(screen.getByText('Air Quality Index')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByTestId('wind-icon')).toBeInTheDocument();
  });

  it('displays positive change with green color', () => {
    render(
      <MetricsCard
        title="Air Quality Index"
        value="42"
        change={5.2}
        icon={<Wind />}
      />
    );

    const changeElement = screen.getByText('5.2%');
    expect(changeElement).toHaveClass('text-green-500');
  });

  it('displays negative change with red color', () => {
    render(
      <MetricsCard
        title="Air Quality Index"
        value="42"
        change={-3.1}
        icon={<Wind />}
      />
    );

    const changeElement = screen.getByText('3.1%');
    expect(changeElement).toHaveClass('text-red-500');
  });
});