import { fetchUsers, updateUser } from './usersService';

test('updates are saved and returned by the next fetch', async () => {
  const updated = await updateUser('1', { name: 'Sarah J. Connor' });
  expect(updated.name).toBe('Sarah J. Connor');

  const users = await fetchUsers();
  expect(users.find((u) => u.id === '1')?.name).toBe('Sarah J. Connor');
});

test('rejects an email another user already has', async () => {
  await expect(
    updateUser('1', { email: 'JOHN@initech.com' }) // case doesn't matter
  ).rejects.toThrow('Another user already has that email address.');
});

test('keeping your own email is fine', async () => {
  await expect(
    updateUser('1', { email: 'sarah@acme.com' })
  ).resolves.toMatchObject({ email: 'sarah@acme.com' });
});
