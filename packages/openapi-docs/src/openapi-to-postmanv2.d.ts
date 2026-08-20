declare module 'openapi-to-postmanv2' {
    const Converter: {
        convert: (
            input: { type: string; data: string },
            options: Record<string, unknown>,
            callback: (error: unknown, result: unknown) => void,
        ) => void;
    };
    export default Converter;
}
