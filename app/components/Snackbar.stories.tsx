import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Snackbar } from './Snackbar';

const FIGMA_DESCRIPTION = `
**WHAT:** Icon, label, and a nested chips instance (itself holding two more iconSlot children) inside a "Snackbar Next" frame. Default/Success/Error variants, one Text property.

**WHEN TO USE:** Not built anywhere in the file yet. Documented ahead of need: structurally fits the feedback/success and feedback/error tokens already in the system, a likely candidate for post-recall confirmation or error toasts once that gets designed. Keep as-is for future use.

**DON'T:** Don't assume the nested chips instance is decorative. It carries its own two iconSlot children, meaning the component expects a built-in action chip (dismiss, retry), not just a status icon.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- A second, undocumented piece exists in the real file: a hidden-by-default secondary action wrapping a real Tertiary \`Button\` instance ("Check it"), found only by walking the actual tree — Figma's own description never mentions it. Exposed here as an optional \`secondaryAction\` prop.
- The action chip's color (blue/green/red per variant in the file) came from a stale, orphaned \`chips\` component with color options the real, current \`Chip\` component doesn't have (only Primary/pro). This reproduces the original per-variant color using real tokens, applied as a style override on \`Chip\` rather than through its own \`color\` prop.
- Success and Error don't differentiate the snackbar's own background — both use \`background/inverse\` (confirmed identical), paired with \`text/inverse\` label text. Only the action chip's color differs between them. Default alone uses \`background/surface\` + \`text/primary\`.
- The status icon is baked in per variant, not a prop: \`Info\` (Default), \`CheckCircle\` (Success), \`WarningCircle\` (Error), from Phosphor Icons, each tinted with the matching accent/feedback token.
- The pill's 56px minimum height isn't derived from padding, the same as other fixed dimensions found in this file — reused \`size.illustration.700\` (already added for ButtonIcon's L circle) rather than add a new token for the same value.
`;

const meta = {
  title: 'Components/Snackbar',
  component: Snackbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: FIGMA_DESCRIPTION,
      },
    },
  },
  argTypes: {
    variant: { control: 'radio', options: ['Default', 'Success', 'Error'] },
  },
  args: {
    variant: 'Default',
    children: 'Up to 2 lines of text. Keep it as short as possible.',
    action: { label: 'Retry', onClick: () => {} },
  },
} satisfies Meta<typeof Snackbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Success: Story = {
  args: { variant: 'Success', action: { label: 'Undo', onClick: () => {} } },
};

export const Error: Story = {
  args: { variant: 'Error', action: { label: 'Retry', onClick: () => {} } },
};
