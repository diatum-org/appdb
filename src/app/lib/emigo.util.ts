import * as  base64 from "base-64";
import * as utf8 from "utf8";

import { Emigo } from './emigo';
import { EmigoMessage } from './emigoMessage';

export function getEmigoObject(msg: EmigoMessage): Emigo {

    // TODO validate message signature

    // extract message
    let emigo: Emigo = JSON.parse(utf8.decode(base64.decode(msg.data)));

    // TODO confirm key hash

    // return emigo message
    return emigo;
}

