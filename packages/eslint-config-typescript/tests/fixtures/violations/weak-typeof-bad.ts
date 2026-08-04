const payload: unknown = { id: '1' };
export const expected = { id: '1' } satisfies NonNullable<typeof payload>;
