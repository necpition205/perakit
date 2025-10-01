import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { Portal } from './Portal';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  width?: number | string;
};

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 50;
`;

const Card = styled.div<{ width?: number | string }>`
  width: ${({ width }) => (typeof width === 'number' ? `${width}px` : width || '520px')};
  max-width: calc(100vw - 32px);
  background: #fff; color: inherit; border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; overflow: hidden;
`;

const Header = styled.div`
  padding: 12px; border-bottom: 1px solid var(--border, #e5e7eb);
  font-weight: 600;
`;
const Body = styled.div`
  padding: 12px; max-height: calc(80vh - 120px); overflow: auto;
`;
const Footer = styled.div`
  padding: 12px; border-top: 1px solid var(--border, #e5e7eb);
  display: flex; justify-content: flex-end; gap: 8px;
`;

export default function Modal({ open, onClose, title, footer, children, width }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <Portal>
      <Overlay onClick={onClose}>
        <Card width={width} onClick={(e) => e.stopPropagation()}>
          {title && <Header>{title}</Header>}
          <Body>{children}</Body>
          {footer && <Footer>{footer}</Footer>}
        </Card>
      </Overlay>
    </Portal>
  );
}

