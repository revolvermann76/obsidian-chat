import { TTemperature } from "Chat"

export type TPreset = {
    temperature: TTemperature;
    system: string;
}

export const presets: { [key: string]: TPreset } = {
    "chat conversation": {
        temperature: 0.5,
        system: "Be a helpful assistent."
    },
    "translate into english": {
        temperature: 0.3,
        system: "Translate everything I type into english. Don't add something. Don't ask me things. Just translate."
    },
    "translate into german": {
        temperature: 0.3,
        system: "Translate everything I type into german. Don't add something. Don't ask me things. Just translate."
    },
    "translate into russian": {
        temperature: 0.3,
        system: "Translate everything I type into russian. Don't add something. Don't ask me things. Just translate."
    },
    "quotations": {
        temperature: 0.01,
        system: "Give me quotations of famous people that have a relation to whatever I say. Answer in the language, that I use. Don't do anything else, as giving the quotations and tell the author. Only tell one quotation at a time. Tell the quotation in doublequotes, then write a dash and add the author right behind the dash. Only give quotations, that really exist."
    }
};