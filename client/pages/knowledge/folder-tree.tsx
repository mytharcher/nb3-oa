import { useId, useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ChevronDown,
  ChevronRight,
  Folder as FolderIcon,
  FolderOpen,
  Inbox,
  Library,
} from 'lucide-react';
import { cn } from 'cn';
import { useIsMobile } from '#hooks/use-mobile';
import { Button } from '#components/ui/button';
import type { Folder } from './types.js';

export function KnowledgeFolderTree({
  folders,
  selected,
  choose,
}: {
  folders: Folder[];
  selected: string;
  choose: (id: string) => void;
}) {
  const mobile = useIsMobile();
  return (
    <Tree
      key={String(mobile)}
      folders={folders}
      selected={selected}
      choose={choose}
      defaultOpen={!mobile}
    />
  );
}

function FolderBranch({
  folder,
  childrenByParent,
  selected,
  choose,
  seen,
}: {
  folder: Folder;
  childrenByParent: Map<string | null, Folder[]>;
  selected: string;
  choose: (id: string) => void;
  seen: Set<string>;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const childrenId = useId();
  const children = (childrenByParent.get(folder.id) ?? []).filter(
    (child) => !seen.has(child.id),
  );
  const active = selected === folder.id;
  return (
    <li>
      <div
        className={cn(
          'flex items-center rounded-md',
          active && 'bg-accent text-accent-foreground',
        )}
      >
        {children.length ? (
          <Button
            variant='ghost'
            size='icon'
            className='size-9 shrink-0 sm:size-8'
            aria-label={t(
              expanded ? 'knowledge.collapseFolder' : 'knowledge.expandFolder',
              { name: folder.title },
            )}
            aria-expanded={expanded}
            aria-controls={childrenId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? (
              <ChevronDown aria-hidden />
            ) : (
              <ChevronRight aria-hidden />
            )}
          </Button>
        ) : (
          <span className='w-9 shrink-0 sm:w-8' aria-hidden />
        )}
        <Button
          variant='ghost'
          className={cn(
            'h-auto min-h-11 min-w-0 flex-1 justify-start gap-2 rounded-md px-2 py-2 text-left font-normal whitespace-normal sm:min-h-9',
            active && 'font-medium',
          )}
          aria-pressed={active}
          onClick={() => choose(folder.id)}
        >
          {active ? (
            <FolderOpen
              className='text-primary'
              data-icon='inline-start'
              aria-hidden
            />
          ) : (
            <FolderIcon
              className='text-muted-foreground'
              data-icon='inline-start'
              aria-hidden
            />
          )}
          <span className='min-w-0 break-words'>{folder.title}</span>
        </Button>
      </div>
      {children.length && expanded ? (
        <ul
          id={childrenId}
          className='ml-4 flex flex-col gap-1 border-l border-border pl-2'
        >
          {children.map((child) => (
            <FolderBranch
              key={child.id}
              folder={child}
              childrenByParent={childrenByParent}
              selected={selected}
              choose={choose}
              seen={new Set([...seen, child.id])}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function Tree({
  folders,
  selected,
  choose,
  defaultOpen,
}: {
  folders: Folder[];
  selected: string;
  choose: (id: string) => void;
  defaultOpen: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const navId = useId();
  const ids = new Set(folders.map((folder) => folder.id));
  const childrenByParent = new Map<string | null, Folder[]>();
  for (const folder of folders) {
    // A readable child remains reachable when its parent is outside the folder view scope.
    const parent =
      folder.parentId && ids.has(folder.parentId) ? folder.parentId : null;
    const siblings = childrenByParent.get(parent) ?? [];
    siblings.push(folder);
    childrenByParent.set(parent, siblings);
  }
  return (
    <section className='w-full min-w-0 rounded-lg border bg-card text-card-foreground'>
      <div className='flex items-center justify-between gap-2 px-3 py-2'>
        <h2 className='flex items-center gap-2 text-sm font-medium'>
          <FolderIcon className='size-4 text-muted-foreground' aria-hidden />
          {t('knowledge.folderTree')}
        </h2>
        <Button
          variant='ghost'
          size='icon'
          aria-label={t(
            open ? 'knowledge.collapseFolders' : 'knowledge.expandFolders',
          )}
          aria-expanded={open}
          aria-controls={navId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
        </Button>
      </div>
      {open ? (
        <nav
          id={navId}
          aria-label={t('knowledge.folderTree')}
          className='border-t p-2 text-sm'
        >
          <div className='flex flex-col gap-1'>
            {[
              { id: '', title: t('knowledge.allFolders'), icon: Library },
              { id: 'root', title: t('knowledge.unfiled'), icon: Inbox },
            ].map(({ id, title, icon: Icon }) => (
              <Button
                key={id}
                variant='ghost'
                className={cn(
                  'h-auto min-h-11 w-full justify-start gap-2 px-3 py-2 font-normal sm:min-h-9',
                  selected === id &&
                    'bg-accent font-medium text-accent-foreground',
                )}
                aria-pressed={selected === id}
                onClick={() => choose(id)}
              >
                <Icon
                  data-icon='inline-start'
                  className={
                    selected === id ? 'text-primary' : 'text-muted-foreground'
                  }
                  aria-hidden
                />
                {title}
              </Button>
            ))}
          </div>
          <div className='mt-2 max-h-72 overflow-auto border-t pt-2'>
            {folders.length ? (
              <ul className='flex flex-col gap-1'>
                {(childrenByParent.get(null) ?? []).map((folder) => (
                  <FolderBranch
                    key={folder.id}
                    folder={folder}
                    childrenByParent={childrenByParent}
                    selected={selected}
                    choose={choose}
                    seen={new Set([folder.id])}
                  />
                ))}
              </ul>
            ) : (
              <p className='px-3 py-4 text-xs leading-relaxed text-muted-foreground'>
                {t('knowledge.noFolders')}
              </p>
            )}
          </div>
        </nav>
      ) : null}
    </section>
  );
}
