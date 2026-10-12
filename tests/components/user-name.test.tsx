import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UserName, UserNameText } from '#components/user-name';
import { userAvatarColor, userInitials } from '#lib/user-identity';

describe('user identity display', () => {
  it('keeps surrounding translated prose and record numbers as text', () => {
    const { container, rerender } = render(
      <UserNameText text='Applicant: Alice Smith' name='Alice Smith' />,
    );
    expect(container).toHaveTextContent('Applicant: ASAlice Smith');
    expect(container.querySelectorAll('[data-slot=avatar]')).toHaveLength(1);
    rerender(<UserNameText text='REQ-0001' name='Alice Smith' />);
    expect(container).toHaveTextContent('REQ-0001');
    expect(container.querySelector('[data-slot=avatar]')).toBeNull();
  });

  it.each([
    ['张小明', '张'],
    [' 王小明 ', '王'],
    ['𠮷田', '𠮷'],
    ['Alice', 'AL'],
    ['Alice Smith', 'AS'],
    [' alice   smith ', 'AS'],
    ['A', 'A'],
    ['', '?'],
  ])('uses the requested initials for %s', (name, initials) => {
    expect(userInitials(name)).toBe(initials);
  });
  it('keeps colors stable and initials readable on the background', () => {
    const names = ['张小明', '王小明', 'Alice', 'Bob', 'Carol', 'David'];
    expect(new Set(names.map(userAvatarColor)).size).toBeGreaterThan(1);
    for (const name of names) {
      const color = userAvatarColor(name);
      expect(userAvatarColor(` ${name} `)).toBe(color);
      const rgb = color
        .slice(1)
        .match(/../g)!
        .map((channel) => {
          const value = parseInt(channel, 16) / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        });
      const luminance = rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
      expect(1.05 / (luminance + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('shows a name once for assistive technology, with decorative initials', () => {
    const { container } = render(<UserName name='张小明' />);
    expect(screen.getByText('张小明')).toHaveAttribute('title', '张小明');
    expect(container.querySelector('[data-slot="avatar"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByText('张')).toBeInTheDocument();
  });
  it('does not turn an absent person into an avatar', () => {
    const { container } = render(<UserName name={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="avatar"]')).toBeNull();
  });
});
