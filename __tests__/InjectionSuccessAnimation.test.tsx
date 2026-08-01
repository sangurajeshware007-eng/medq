import { render, act } from '@testing-library/react-native';
import React from 'react';

import InjectionSuccessAnimation from '../components/InjectionSuccessAnimation';

describe('InjectionSuccessAnimation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the celebration overlay', () => {
    const { getByTestId, getByText } = render(<InjectionSuccessAnimation onDone={jest.fn()} />);
    expect(getByTestId('injection-animation')).toBeTruthy();
    expect(getByText('Booked!')).toBeTruthy();
  });

  it('calls onDone after the sequence completes', () => {
    const onDone = jest.fn();
    render(<InjectionSuccessAnimation onDone={onDone} />);

    // Full sequence ≈ travel 900 + push 320 + burst 450 + hold 650 ≈ 2.3s;
    // advance well past it (Animated timing runs on the fake timer queue).
    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('does not fire onDone when unmounted early', () => {
    const onDone = jest.fn();
    const { unmount } = render(<InjectionSuccessAnimation onDone={onDone} />);
    act(() => {
      jest.advanceTimersByTime(300);
    });
    unmount();
    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(onDone).not.toHaveBeenCalled();
  });
});
