import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

jest.mock('@ant-design/charts', () => {})
jest.mock('@ant-design/plots', () => {})
jest.mock('@antv/g2', () => ({
  registerTheme: () => {}
}))
jest.mock('grapholscape', () => {})
jest.mock('sparqling', () => {})
jest.mock('react-syntax-highlighter/dist/esm/styles/hljs', () => {})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
})
