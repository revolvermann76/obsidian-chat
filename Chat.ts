export type TChatOptions = {
    apiKey: string;
    model?: string;
    temperature?: number;
    endPoint?: string;
    system?: string;
};

export type TTemperature = number;

export type TModel = string;

export type TUtterance = {
    role: string;
    content: string;
}

type TBody = {
    messages: TUtterance[];
    stream: boolean;
    model: TModel;
    temperature: TTemperature;
    [key: string]: unknown;
}

const preset: TChatOptions = {
    apiKey: "",
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    endPoint: "https://api.openai.com/v1/chat/completions",
    system: "Be a helpful assistent."
}


export class Chat {
    #options: TChatOptions;
    #abortController: AbortController;
    #conversation: TUtterance[] = [];


    constructor(options: TChatOptions) {
        this.#options = Object.assign({}, preset, options);
        this.#abortController = new AbortController();
    }

    /**
     * sets the temperature. A number between 0 and 1
     * @param {TTemperature} temperature the temperature
     */
    set temperature(temp: TTemperature) {
        this.#options.temperature = temp;
    }

    /**
     * gets the temperature. A number between 0 and 1
     * @returns {number} the temperature
     */
    get temperature(): TTemperature {
        return this.#options.temperature!;
    }

    /**
     * sets the chat model. 
     * @param {TModel} model - the model
     */
    set model(model: TModel) {
        this.#options.model = model;
    }

    /**
     * gets the chat model. 
     * @returns {TModel} the model
     */
    get model(): TModel {
        return this.#options.model!;
    }

    /**
     * get the conversation so far
     * @returns {TUtterance[]} a list of utterances
     */
    get conversation(): TUtterance[] {
        return [...this.#conversation];
    }

    /**
     * forgets the API-key. After this call, this class gets useless.
     */
    logout() {
        this.#options.apiKey = "";
    }

    /**
     * discards the ongoing conversation
     */
    reset() {
        console.debug("ChatGPT.reset()");
        this.#conversation = [];
    }

    /**
     * stops a stream while it is running
     */
    abort() {
        console.debug("ChatGPT.abort()");
        this.#abortController.abort();
        this.#abortController = new AbortController();
    }

    /**
     * sends a prompt to the API. 
     * @param prompt - a query that is send to the api
     * @param partHandler - get parts of the response, while it isn't already completely generated
     * @returns {Promise<string>} a promise, that resolves to the answered prompt
     */
    async stream(
        prompt: string,
        options?: {
            temperature?: TTemperature,
            system?: string,
            partHandler?: (part: string) => void
        }): Promise<string> {
        console.debug(`ChatGPT.stream("${prompt}")`);
        //append to conversation
        this.#conversation.push({
            role: 'user',
            content: prompt
        });

        //preset the fetch
        const body: TBody = {
            stream: true,
            messages: [
                {
                    role: 'system',
                    content: options && options.system ? options.system : this.#options.system!
                },
                ...this.#conversation
            ],
            model: this.#options.model!,
            temperature: options && options.temperature ? options.temperature : this.#options.temperature!
        }

        const signal: AbortSignal = this.#abortController.signal;
        try {
            // do the request
            const response = await fetch(
                this.#options.endPoint!,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.#options.apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body),
                    signal
                }
            )

            // handle any errors
            if (!response.ok) {
                if (response.status == 401) {
                    throw (new Error('401 Unauthorized, invalide API Key'));
                }
                throw (new Error('failed to get data, error status ' + response.status));
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder("utf-8");
            let result = ""; // the concatenated result
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                // Lines do not always contain a whole JSON object. If a line does not end
                // with a line break, it is fragmented. The fragment gets pushed into the buffer
                // and will get added to the front of the next incoming chunk
                const chunk = buffer + decoder.decode(value);
                const chunkEndsWithLineBreak = chunk.endsWith("\n");
                const lines = chunk.split("\n");
                if (!chunkEndsWithLineBreak) {
                    buffer = lines.pop()!;
                } else {
                    buffer = "";
                }

                // lines get trimmed and parsed
                const parsedLines = lines
                    .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
                    .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
                    .map((line) => JSON.parse(line)); // Parse the JSON string

                // extract the content from the lines and add it to the result
                for (const parsedLine of parsedLines) {
                    const { choices } = parsedLine;
                    const { delta } = choices[0];
                    const { content } = delta;

                    if (content) {
                        result += content;
                        if (options && options.partHandler) {
                            options.partHandler(result);
                        }
                    }
                }
            }
            // append to the conversation
            this.#conversation.push({
                role: "assistant",
                content: result
            })

            // all done, resolve with the result
            return result;
        } catch (error) {
            throw error;
        }

    }

    async request(
        prompt: string,
        options?: {
            temperature?: TTemperature,
            system?: string,
            partHandler?: (part: string) => void
        }) {
        console.debug(`ChatGPT.request("${prompt}")`);

        //preset the fetch
        const body: TBody = {
            stream: false,
            messages: [
                {
                    role: 'system',
                    content: options && options.system ? options.system : this.#options.system!
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: this.#options.model!,
            temperature: options && options.temperature ? options.temperature : this.#options.temperature!
        }

        const signal: AbortSignal = this.#abortController.signal;
        try {
            // do the request
            const response = await fetch(
                this.#options.endPoint!,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.#options.apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body),
                    signal
                }
            )

            // handle any errors
            if (!response.ok) {
                if (response.status == 401) {
                    throw (new Error('401 Unauthorized, invalide API Key'));
                }
                throw (new Error('failed to get data, error status ' + response.status));
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder("utf-8");
            let result = ""; // the concatenated result
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                // Lines do not always contain a whole JSON object. If a line does not end
                // with a line break, it is fragmented. The fragment gets pushed into the buffer
                // and will get added to the front of the next incoming chunk
                const chunk = buffer + decoder.decode(value);
                const chunkEndsWithLineBreak = chunk.endsWith("\n");
                const lines = chunk.split("\n");
                if (!chunkEndsWithLineBreak) {
                    buffer = lines.pop()!;
                } else {
                    buffer = "";
                }

                // lines get trimmed and parsed
                const parsedLines = lines
                    .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
                    .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
                    .map((line) => JSON.parse(line)); // Parse the JSON string

                // extract the content from the lines and add it to the result
                for (const parsedLine of parsedLines) {
                    const { choices } = parsedLine;
                    const { delta } = choices[0];
                    const { content } = delta;

                    if (content) {
                        result += content;
                        if (options && options.partHandler) {
                            options.partHandler(result);
                        }
                    }
                }
            }

            // all done, resolve with the result
            return result;
        } catch (error) {
            throw error;
        }

    }


}