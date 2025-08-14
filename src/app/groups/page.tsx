"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PencilSquareIcon, TrashIcon, ArrowRightCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageTitle from '@/components/PageTitle';
import GroupModal from '@/components/GroupModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useAppDispatch, useAppSelector } from '@/app/features/hooks';
import { createGroup, fetchAvailableGroups, fetchUserGroups, updateGroup } from '@/app/features/groups/slice';
import type { CreateOrUpdateGroupBody } from '@/app/types/group';
import type { GroupProps } from '@/app/types';

export default function GroupsPage() {
  const dispatch = useAppDispatch();
  const availableGroups = useAppSelector((s) => s.groups.availableGroups);
  const membershipMap = useAppSelector((s) => s.groups.userMembership);
  const user = useAppSelector((s) => s.auth.user);
  const canEdit = (g: GroupProps) => !!user && (user.admin || g.creator.id === user.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupProps | undefined>(undefined);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchAvailableGroups({ page: 1, per_page: 10 }));
    dispatch(fetchUserGroups({ page: 1, per_page: 50 }));
  }, [dispatch]);

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

  const handleSave = async (updatedGroup: GroupProps) => {
    if (isNew) {
      const body: CreateOrUpdateGroupBody = {
        name: updatedGroup.title.trim(),
        description: updatedGroup.description.trim(),
        isPrivate: updatedGroup.inviteOnly,
      };
      const action = await dispatch(createGroup(body));
      if (createGroup.fulfilled.match(action)) {
        dispatch(fetchAvailableGroups({ page: 1, per_page: 10 }));
      } else {
        alert((action.payload as string) ?? 'Create group failed');
      }
    } else {
      const body: CreateOrUpdateGroupBody = {
        name: updatedGroup.title.trim(),
        description: updatedGroup.description.trim(),
        isPrivate: updatedGroup.inviteOnly,
      };
      const action = await dispatch(updateGroup({ groupId: updatedGroup.id, body }));
      if (updateGroup.fulfilled.match(action)) {
        dispatch(fetchAvailableGroups({ page: 1, per_page: 10 }));
      } else {
        alert((action.payload as string) ?? 'Update group failed');
      }
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: number) => {
    setGroupToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    setIsDeleteConfirmOpen(false);
    setGroupToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setGroupToDelete(null);
  };

  return (
    <>
      <PageTitle title="Groups" showPageTitle={true} />
      <button
        onClick={handleAdd}
        className="fixed md:hidden bottom-8  z-20 left-1/2 -translate-x-1/2 bg-yellow px-3 py-3 rounded-[50%]">
        <PlusIcon className="h-7 w-7 text-white" />
      </button>

      <div className="container mx-auto p-4 min-h-screen">
        <div className='hidden md:flex justify-end mr-4'>
          <button
            onClick={handleAdd}
            className="mb-4 flex items-center px-4 py-2 bg-dark-green text-white rounded-sm hover:bg-green"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Group
          </button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto p-4">
          <table className="min-w-full bg-bg shadow-lg">
            <thead>
              <tr className="bg-light-gray text-dark-gray">
                <th className="py-2 px-4 text-left">Title</th>
                <th className="py-2 px-4 text-left">Description</th>
                <th className="py-2 px-4 text-left">Created Date</th>
                <th className="py-2 px-4 text-left">Creator</th>
                <th className="py-2 px-4 text-left">Membership</th>
                <th className="py-2 px-4 text-left">View</th>
                <th className="py-2 px-4 text-left">Manage</th>
              </tr>
            </thead>
            <tbody>
              {availableGroups.map((group, index) => {
                const isSubscribed = !!membershipMap[group.id] || group.subscribed;
                const canEdit = !!user && (user.admin || group.creator.id === user.id);

                return (
                  <tr key={group.id} className={`${index % 2 === 0 ? '' : 'bg-gray-50'}`}>
                    <td className="py-2 px-4 text-gray">{group.title}</td>
                    <td className="py-2 px-4 text-gray">{group.description}</td>
                    <td className="py-2 px-4 text-gray">{group.createdDate}</td>
                    <td className="py-2 px-4 text-gray">{group.creator.firstName}</td>
                    <td className="py-2 px-4">
                      <button
                        className={`w-28 py-1 rounded-md text-white ${isSubscribed ? 'bg-yellow hover:bg-dark-yellow' : 'bg-green hover:bg-dark-green'
                          }`}
                      >
                        {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                      </button>
                    </td>
                    <td className="py-2 px-4">
                      <Link href={`/groups/${group.id}`}>
                        <ArrowRightCircleIcon className="h-7 w-7 text-green hover:text-dark-green cursor-pointer" />
                      </Link>
                    </td>
                    <td className="py-2 px-4 flex justify-center items-center space-x-2 min-h-[60px]">
                      {canEdit && (
                        <>
                          <PencilSquareIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => handleEdit(group)} />
                          <TrashIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => handleDeleteClick(group.id)} />
                        </>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {availableGroups.map((group) => (
            <div
              className={`card p-3 ${group.inviteOnly ? 'backdrop-blur-sm bg-opacity-80' : ''}`}
              key={group.id}
            >
              <div className="absolute right-2 t-5 flex space-x-2">
                {canEdit(group) && (
                  <>
                    <PencilSquareIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => handleEdit(group)} />
                    <TrashIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" />
                  </>
                )}
              </div>
              <h2 className="text-lg font-semibold text-dark-gray mt-5">{group.title}</h2>
              <p className="text-gray text-sm">{group.description}</p>
              <p className="text-xs text-gray mt-1">
                Created: {group.createdDate} by {group.creator.firstName}
                {group.inviteOnly && <span className="text-dark-green"> (Invite Only)</span>}
              </p>
              <div className="mt-2 flex justify-between items-center">
                <button className={`w-28 py-1 rounded-md text-white ${group.subscribed ? 'bg-yellow hover:bg-dark-yellow' : 'bg-green hover:bg-dark-green'}`} >
                  {group.subscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>
                <Link href={`/groups/${group.id}`}>
                  <ArrowRightCircleIcon className="h-7 w-7 text-green hover:text-dark-green cursor-pointer" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

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
