import { FormEvent, useState } from 'react';
import { User } from '../../types';
import { UserChanges } from '../../services/usersService';
import Button from './Button';
import Modal from './Modal';

interface EditUserModalProps {
  user: User | null; // null = closed
  onClose: () => void;
  onSave: (changes: UserChanges) => Promise<void>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<'name' | 'email', string>>;

const validate = (name: string, email: string): FieldErrors => {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = 'Enter a name.';
  if (!email.trim()) errors.email = 'Enter an email address.';
  else if (!EMAIL_PATTERN.test(email.trim()))
    errors.email = 'Enter a valid email address, like name@company.com.';
  return errors;
};

const EditUserModal = ({ user, onClose, onSave }: EditUserModalProps) => (
  <Modal isOpen={user !== null} onClose={onClose} title="Edit user">
    {/* key: a different user gets a brand-new form, so its fields start
        from that user's values instead of the previous user's */}
    {user && (
      <EditUserForm
        key={user.id}
        user={user}
        onCancel={onClose}
        onSave={onSave}
      />
    )}
  </Modal>
);

interface EditUserFormProps {
  user: User;
  onCancel: () => void;
  onSave: (changes: UserChanges) => Promise<void>;
}

const EditUserForm = ({ user, onCancel, onSave }: EditUserFormProps) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<User['role']>(user.role);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 1. Check what we can in the browser -- instant feedback, no request
    const fieldErrors = validate(name, email);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    // 2. Let the "server" check the rest (e.g. the email is already taken)
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSave({ name: name.trim(), email: email.trim(), role });
      // On success the page closes the modal, so this form unmounts
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save.');
      setIsSaving(false);
    }
  };

  return (
    <form className="modal__form" onSubmit={handleSubmit} noValidate>
      <label className="form-field">
        <span className="form-field__label">Name</span>
        <input
          className="form-field__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'edit-user-name-error' : undefined}
          autoComplete="off"
        />
        {errors.name && (
          <span id="edit-user-name-error" className="form-field__hint">
            {errors.name}
          </span>
        )}
      </label>

      <label className="form-field">
        <span className="form-field__label">Email</span>
        <input
          className="form-field__input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'edit-user-email-error' : undefined}
          autoComplete="off"
        />
        {errors.email && (
          <span id="edit-user-email-error" className="form-field__hint">
            {errors.email}
          </span>
        )}
      </label>

      <label className="form-field">
        <span className="form-field__label">Role</span>
        <select
          className="form-field__input"
          value={role}
          onChange={(e) => setRole(e.target.value as User['role'])}
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </label>

      {saveError && (
        <p className="form-error" role="alert">
          {saveError}
        </p>
      )}

      <div className="modal__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSaving}>
          Save changes
        </Button>
      </div>
    </form>
  );
};

export default EditUserModal;
