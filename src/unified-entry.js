// Unified ecosystem bundle for VibeReader extension
// This file exports all necessary unified modules as a single global object

import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import rehypeFormat from 'rehype-format';
import rehypeRemark from 'rehype-remark';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';

// Export everything as a single global object
const UnifiedLib = {
  // Core
  unified,
  
  // Rehype plugins
  rehypeParse,
  rehypeStringify,
  rehypeFormat,
  rehypeRemark,
  
  // Remark plugins
  remarkStringify,
  remarkGfm,
  
  // Utilities
  visit,
  select,
  selectAll
};

// Make available globally for browser extension
if (typeof window !== 'undefined') {
  window.UnifiedLib = UnifiedLib;
}

export default UnifiedLib;