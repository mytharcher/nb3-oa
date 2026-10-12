import { createRoot } from 'react-dom/client';
import { UserName } from '../../../client/components/user-name';
const names = [
  '张小明',
  '王小明',
  'Alice Smith',
  'Alice',
  'Bob Wu',
  '这是一个用于检查省略显示的很长很长的姓名',
  null,
];
createRoot(document.getElementById('root')!).render(
  <main className='mx-auto flex max-w-lg flex-col gap-4 p-4 text-sm'>
    <h1 className='text-base font-medium'>用户名称展示 / User identities</h1>
    <div className='rounded-lg border bg-card'>
      <table className='w-full'>
        <thead>
          <tr className='border-b'>
            <th className='p-3 text-left'>姓名 / Name</th>
            <th className='p-3 text-left'>角色 / Role</th>
          </tr>
        </thead>
        <tbody>
          {names.map((name) => (
            <tr key={name ?? 'empty'} className='border-b last:border-0'>
              <td className='max-w-48 p-3'>
                <UserName name={name} />
              </td>
              <td className='p-3'>员工</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </main>,
);
