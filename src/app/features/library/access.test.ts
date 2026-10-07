import {
  needsLibraryAccessHeader,
  libraryAccessUrl,
  getLibraryAccessCode,
  setLibraryAccessCode,
  clearLibraryAccessCode,
} from './access';

describe('needsLibraryAccessHeader', () => {
  it('matches library member endpoints only', () => {
    expect(needsLibraryAccessHeader('/library/catalog?q=x')).toBe(true);
    expect(needsLibraryAccessHeader('library/items/3/borrow')).toBe(true);
    expect(needsLibraryAccessHeader('/library/my-borrows')).toBe(true);
    expect(needsLibraryAccessHeader('/groups/visible')).toBe(false);
    expect(needsLibraryAccessHeader('/notifications')).toBe(false);
  });
  it('does not send the code to the access check itself', () => {
    expect(needsLibraryAccessHeader('/library/access/abc')).toBe(false);
  });
});

describe('libraryAccessUrl', () => {
  it('builds the shareable link', () => {
    expect(libraryAccessUrl('Ab3_x', 'https://canberra-ccc.info')).toBe('https://canberra-ccc.info/library/access/Ab3_x');
  });
});

describe('session storage of the code', () => {
  it('stores, reads and clears', () => {
    setLibraryAccessCode('k1');
    expect(getLibraryAccessCode()).toBe('k1');
    clearLibraryAccessCode();
    expect(getLibraryAccessCode()).toBeNull();
  });
});
