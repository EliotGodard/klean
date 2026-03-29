-- Move heure_releve from per-equipment to global configuration
alter table configuration add column heure_releve_temperature time not null default '08:00';

alter table equipements_temperature drop column heure_releve;
