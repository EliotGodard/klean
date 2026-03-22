-- Configuration (singleton)
create table configuration (
  id uuid primary key default gen_random_uuid(),
  jours_ouverture int[] not null default '{1,2,3,4,5,6}',
  fermetures_exceptionnelles date[] default '{}',
  frequence_analyse_surfaces text not null default 'hebdomadaire',
  jour_analyse_surfaces int not null default 1,
  updated_at timestamptz not null default now()
);

insert into configuration (jours_ouverture) values ('{1,2,3,4,5,6}');

-- Fournisseurs
create table fournisseurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  categorie_produits text,
  telephone text,
  email text,
  numero_agrement text,
  archive boolean not null default false,
  created_at timestamptz not null default now()
);

-- Étiquettes photos
create table etiquettes_photos (
  id uuid primary key default gen_random_uuid(),
  fournisseur_id uuid not null references fournisseurs(id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);

-- Équipements température
create table equipements_temperature (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  emplacement text,
  temp_min decimal not null,
  temp_max decimal not null,
  heure_releve time not null,
  created_at timestamptz not null default now()
);

-- Relevés température
create table releves_temperature (
  id uuid primary key default gen_random_uuid(),
  equipement_id uuid not null references equipements_temperature(id) on delete cascade,
  date date not null,
  valeur decimal,
  conforme boolean not null,
  action_corrective text,
  commentaire text,
  created_at timestamptz not null default now()
);

-- Livraisons
create table livraisons (
  id uuid primary key default gen_random_uuid(),
  fournisseur_id uuid not null references fournisseurs(id),
  date timestamptz not null default now(),
  conforme boolean not null,
  commentaire text,
  created_at timestamptz not null default now()
);

-- Non-conformités
create table non_conformites (
  id uuid primary key default gen_random_uuid(),
  livraison_id uuid not null unique references livraisons(id) on delete cascade,
  raisons text[] not null,
  action_corrective text not null,
  created_at timestamptz not null default now()
);

-- Photos livraison
create table livraison_photos (
  id uuid primary key default gen_random_uuid(),
  livraison_id uuid not null references livraisons(id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);

-- Catégories nettoyage
create table categories_nettoyage (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  created_at timestamptz not null default now()
);

-- Équipements nettoyage
create table equipements_nettoyage (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  categorie_id uuid not null references categories_nettoyage(id) on delete cascade,
  frequence text not null,
  jours int[],
  created_at timestamptz not null default now()
);

-- Validations nettoyage
create table validations_nettoyage (
  id uuid primary key default gen_random_uuid(),
  equipement_id uuid not null references equipements_nettoyage(id) on delete cascade,
  date date not null,
  valide boolean not null default false,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (equipement_id, date)
);

-- Surfaces
create table surfaces (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_at timestamptz not null default now()
);

-- Cycles analyse
create table cycles_analyse (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  created_at timestamptz not null default now()
);

-- Résultats analyse
create table resultats_analyse (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references cycles_analyse(id) on delete cascade,
  surface_id uuid not null references surfaces(id) on delete cascade,
  satisfaisant boolean,
  plan_action text,
  created_at timestamptz not null default now()
);
