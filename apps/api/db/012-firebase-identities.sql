CREATE TABLE IF NOT EXISTS learner_firebase_identities (
  project_id varchar(128) NOT NULL,
  firebase_uid varchar(128) NOT NULL,
  account_id uuid NOT NULL REFERENCES learner_accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, firebase_uid),
  UNIQUE (account_id, project_id)
);
