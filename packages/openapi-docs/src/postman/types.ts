export interface PostmanVariable {
    key: string;
    value: string;
    type?: string;
}

export interface PostmanScript {
    type: 'text/javascript';
    exec: string[];
}

export interface PostmanEvent {
    listen: 'prerequest' | 'test';
    script: PostmanScript;
}

export interface PostmanUrl {
    path?: string[];
    host?: string[];
}

export interface PostmanRequest {
    method?: string;
    url?: PostmanUrl;
    body?: {
        mode?: string;
        raw?: string;
        options?: {
            raw?: {
                language?: string;
            };
        };
    };
}

export interface PostmanItem {
    id?: string;
    name?: string;
    item?: PostmanItem[];
    response?: { code?: number }[];
    request?: PostmanRequest;
    event?: PostmanEvent[];
}

export interface PostmanCollection {
    item?: PostmanItem[];
    event?: PostmanEvent[];
    variable?: PostmanVariable[];
}

export interface ConversionOutput {
    data?: PostmanCollection;
}

export interface ConversionResult {
    result?: boolean;
    output?: ConversionOutput[];
}
