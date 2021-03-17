import { Attribute } from './attribute';

export interface AttributeEntryView {
    attributeId: string;
    attribute: Attribute;
    labels: Array<string>;
}

