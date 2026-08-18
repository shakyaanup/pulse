import { Badge, Button } from '../../components/common';

const UserTable = () => {
  return (
    <table className="user-table">
      <thead>
        <tr>
          <th>User</th>
          <th>Role</th>
          <th>Status</th>
          <th>Joined</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div className="user-table__user-cell">
              <div className="user-table__avatar">A</div>
              <div className="user-table__user-info">
                <span className="user-table__name">Anup Shakya</span>
                <span className="user-table__email">
                  anup.shakya60@gmail.com
                </span>
              </div>
            </div>
          </td>
          <td>
            <span className="user-table__role">Admin</span>
          </td>
          <td>
            <Badge label="Active" variant="success" />
          </td>
          <td>
            <span className="user-table__date">2024-01-12</span>
          </td>
          <td>
            <div className="user-table__actions">
              <Button variant="secondary" size="sm">
                Edit
              </Button>
              <Button variant="danger" size="sm">
                Suspend
              </Button>
            </div>
          </td>
        </tr>
        <tr>
          <td>
            <div className="user-table__user-cell">
              <div className="user-table__avatar">A</div>
              <div className="user-table__user-info">
                <span className="user-table__name">Alisha Khadgi</span>
                <span className="user-table__email">
                  alisha.khadgi@gmail.com
                </span>
              </div>
            </div>
          </td>
          <td>
            <span className="user-table__role">Admin</span>
          </td>
          <td>
            <Badge label="Active" variant="success" />
          </td>
          <td>
            <span className="user-table__date">2024-01-12</span>
          </td>
          <td>
            <div className="user-table__actions">
              <Button variant="secondary" size="sm">
                Edit
              </Button>
              <Button variant="danger" size="sm">
                Suspend
              </Button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default UserTable;
