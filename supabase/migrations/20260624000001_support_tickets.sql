-- Support tickets and messages for the in-app chat
create table if not exists support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references wise_users(id) on delete cascade,
  status      text not null default 'open' check (status in ('open','closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists support_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references support_tickets(id) on delete cascade,
  from_role   text not null check (from_role in ('user','support')),
  text        text not null,
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists support_tickets_user_id_idx on support_tickets(user_id);
create index if not exists support_messages_ticket_id_idx on support_messages(ticket_id, created_at);

-- RLS
alter table support_tickets enable row level security;
alter table support_messages enable row level security;

-- Users can see and create their own tickets
create policy "users_own_tickets" on support_tickets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Users can read messages on their tickets
create policy "users_read_messages" on support_messages
  for select using (
    ticket_id in (select id from support_tickets where user_id = auth.uid())
  );

-- Users can insert messages on their own tickets
create policy "users_insert_messages" on support_messages
  for insert with check (
    from_role = 'user'
    and ticket_id in (select id from support_tickets where user_id = auth.uid())
  );

-- Admins can do anything
create policy "admins_all_tickets" on support_tickets
  for all using (is_admin()) with check (is_admin());

create policy "admins_all_messages" on support_messages
  for all using (is_admin()) with check (is_admin());

-- RPC: get or create the open ticket for the current user
create or replace function get_or_create_support_ticket()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket_id uuid;
begin
  select id into v_ticket_id
  from support_tickets
  where user_id = auth.uid() and status = 'open'
  order by created_at desc
  limit 1;

  if v_ticket_id is null then
    insert into support_tickets (user_id) values (auth.uid())
    returning id into v_ticket_id;

    -- Insert the automated welcome message
    insert into support_messages (ticket_id, from_role, text)
    values (v_ticket_id, 'support', 'Bonjour ! Comment puis-je vous aider aujourd''hui ?');
  end if;

  return v_ticket_id;
end;
$$;
