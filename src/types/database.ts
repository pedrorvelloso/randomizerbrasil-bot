export interface Runner {
  id: string;
  stream_name: string;
  source_id: string | null;
  source: 'discord' | 'manual';
  created_at: string;
}

export interface RunnerInsert {
  stream_name: string;
  source_id?: string | null;
  source?: 'discord' | 'manual';
}

export interface Database {
  public: {
    Tables: {
      runners: {
        Row: Runner;
        Insert: RunnerInsert;
        Update: Partial<RunnerInsert>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
