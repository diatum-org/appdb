import * as  base64 from "base-64";
import * as utf8 from "utf8";

import { Amigo } from './amigo';
import { AmigoMessage } from './amigoMessage';

export function getAmigoObject(msg: AmigoMessage): Amigo {

    // TODO validate message signature

    // extract message
    let amigo: Amigo = JSON.parse(utf8.decode(base64.decode(msg.data)));

    // TODO confirm key hash

    // return amigo message
    return amigo;
}

