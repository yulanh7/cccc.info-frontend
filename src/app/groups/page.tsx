"use client";
import React, { useState, useEffect } from 'react';
import { mockGroups } from '@/app/data/mockData';
import { GroupProps } from '@/app/types'
import Link from 'next/link';
import { PencilSquareIcon, TrashIcon, ArrowRightCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageTitle from '@/components/PageTitle';
import GroupModal from '@/components/GroupModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function GroupsPage() {

  const [groups, setGroups] = useState<GroupProps[]>(mockGroups);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupProps | undefined>(undefined);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

  useEffect(() => {
    // fetchGroups().then(setGroups);
  }, []);

  const handleEdit = (group: GroupProps) => {
    setSelectedGroup(group);
    setIsNew(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedGroup(undefined);
    setIsNew(true);
    setIsModalOpen(true);
  };

  const handleSave = (updatedGroup: GroupProps) => {
    // saveGroup(updatedGroup).then((savedGroup) => {
    //   setGroups((prev) =>
    //     updatedGroup.id === 0
    //       ? [...prev, savedGroup]
    //       : prev.map((g) => (g.id === savedGroup.id ? savedGroup : g))
    //   );
    // });
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: number) => {
    setGroupToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (groupToDelete !== null) {
      setGroups(groups.filter((g) => g.id !== groupToDelete));
      setIsDeleteConfirmOpen(false);
      setGroupToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setGroupToDelete(null);
  };

  return (
    <>
      <PageTitle title="Groups" showPageTitle={true} />
      <div className="container mx-auto p-4">
        <div className='flex justify-end mr-4'>
          <button
            onClick={handleAdd}
            className="mb-4 flex items-center px-4 py-2 bg-dark-green text-white rounded-sm hover:bg-green"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Group
          </button>
        </div>
        {/* Table for medium and larger screens */}
        <div className="hidden md:block overflow-x-auto p-4">
          <table className="min-w-full bg-bg   shadow-lg">
            <thead>
              <tr className="bg-light-gray text-dark-gray">
                <th className="py-2 px-4 text-left">Title</th>
                <th className="py-2 px-4 text-left">Description</th>
                <th className="py-2 px-4 text-left">Created Date</th>
                <th className="py-2 px-4 text-left">Creator</th>
                <th className="py-2 px-4 text-left">Subscription</th>
                <th className="py-2 px-4 text-left">Actions</th>
                <th className="py-2 px-4 text-left">View</th>
              </tr>
            </thead>
            <tbody>
              {mockGroups.map((group, index) => (
                <tr
                  key={group.id}
                  className={`${index % 2 === 0 ? '' : 'bg-gray-50'}`}
                >
                  <td className="py-2 px-4 text-gray">{group.title}</td>
                  <td className="py-2 px-4 text-gray">{group.description}</td>
                  <td className="py-2 px-4 text-gray">{group.createdDate}</td>
                  <td className="py-2 px-4 text-gray">{group.creator.first_name}</td>
                  <td className="py-2 px-4">
                    <button className={`w-28 py-1 rounded-md text-white ${group.subscribed ? 'bg-yellow hover:bg-dark-yellow' : 'bg-green hover:bg-dark-green'}`} >
                      {group.subscribed ? 'Unsubscribe' : 'Subscribe'}
                    </button>
                  </td>
                  <td className="py-2 px-4 flex justify-center items-center space-x-2 min-h-[60px]">
                    {group.editable && (
                      <>
                        <PencilSquareIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => handleEdit(group)} />
                        <TrashIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => handleDeleteClick(group.id)} />
                      </>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    <Link href={`/groups/${group.id}`}>
                      <ArrowRightCircleIcon className="h-7 w-7 text-green hover:text-dark-green cursor-pointer" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4">
          {mockGroups.map((group) => (
            <div
              className={`p-4 bg-white border border-border rounded-base shadow-md transition-all ${group.inviteOnly ? 'backdrop-blur-sm bg-opacity-80' : ''
                }`}
              key={group.id}
            >
              <div className="absolute right-10 t-5 flex space-x-2">
                {group.editable && (
                  <>
                    <PencilSquareIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => handleEdit(group)} />
                    <TrashIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" />
                  </>
                )}
              </div>
              <h2 className="text-lg font-semibold text-dark-gray mt-5">{group.title}</h2>
              <p className="text-gray text-sm">{group.description}</p>
              <p className="text-xs text-gray mt-1">
                Created: {group.createdDate} by {group.creator.first_name}
                {group.inviteOnly && <span className="text-dark-green"> (Invite Only)</span>}
              </p>
              <div className="mt-2 flex justify-between items-center">
                <button className={`w-28 py-1 rounded-md text-white ${group.subscribed ? 'bg-yellow hover:bg-dark-yellow' : 'bg-green hover:bg-dark-green'}`} >
                  {group.subscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>

                <ArrowRightCircleIcon className="h-7 w-7 text-green hover:text-dark-green cursor-pointer" />

              </div>
            </div>
          ))}
        </div>
      </div >
      {isModalOpen && (
        <GroupModal
          group={selectedGroup}
          isNew={isNew}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        message="Are you sure you want to delete this group?"
      />
    </>

  );
}