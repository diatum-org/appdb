import { SubjectAsset } from './subjectAsset';

export class FeedSubjectEntry {
  subjectId: string;
  created: number;
  modified: number;
  expires: number;
  schema: string;
  data: string;
  revision: number;
  appData: any;
  ready: boolean;
  share: boolean;
  tagCount: number;
  assets: Array<SubjectAsset>;
  originals: Array<SubjectAsset>;
}

