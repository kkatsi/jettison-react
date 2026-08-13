import { Controller } from 'react-hook-form';

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TONE_TEXT,
  type FilterOption,
} from '@shared/ui';
import { cn } from '@shared/utils/cn';

import { Field } from '../../components/Field';
import { useDetailsStep } from './useDetailsStep';

// Step 1 — what every store reads off the release before it reads the audio.
export function DetailsStep() {
  const { form, artists, genres, types, typeHint, lead } = useDetailsStep();
  const { errors } = form.formState;

  return (
    <div className="flex max-w-160 flex-col gap-7">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Release details</h2>
        <p className="mt-1.5 text-sm text-faint">
          Metadata is sent to every store exactly as entered here.
        </p>
      </div>

      <Field label="Release title" error={errors.title?.message}>
        <Input {...form.register('title')} placeholder="e.g. Neon Arterial" className="h-9.5" />
      </Field>

      <div className="grid grid-cols-2 gap-5">
        <Field label="Primary artist">
          <Controller
            control={form.control}
            name="artistId"
            render={({ field }) => (
              <Picker
                options={artists}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Choose an artist"
              />
            )}
          />
        </Field>

        <Field label="Genre">
          <Controller
            control={form.control}
            name="genre"
            render={({ field }) => (
              <Picker
                options={genres}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Choose a genre"
              />
            )}
          />
        </Field>
      </div>

      <Field label="Release type" hint={typeHint}>
        <div className="flex w-fit gap-0.5 rounded-lg border border-line bg-panel p-0.75">
          {types.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={type.onSelect}
              className={cn(
                'flex h-7.5 items-center justify-center rounded-md px-5 text-sm font-medium',
                type.isSelected ? 'bg-brand text-white' : 'text-subtle hover:text-text',
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 items-start gap-5">
        <Field label="Planned release date" error={errors.releaseDate?.message}>
          <Input
            {...form.register('releaseDate')}
            type="date"
            className="h-9.5 font-mono [color-scheme:dark]"
          />
          <div className="flex items-center gap-1.75">
            <span className={cn('size-1.25 rounded-full bg-current', TONE_TEXT[lead.tone])} />
            <span className={cn('text-xs', TONE_TEXT[lead.tone])}>{lead.text}</span>
          </div>
        </Field>

        <Field
          label="Label copyright line"
          hint="Delivered verbatim to every store."
          error={errors.pLine?.message}
        >
          <Input {...form.register('pLine')} className="h-9.5" />
        </Field>
      </div>
    </div>
  );
}

type PickerProps = {
  options: FilterOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
};

function Picker({ options, value, onValueChange, placeholder }: PickerProps) {
  return (
    <Select items={options} value={value} onValueChange={(next) => onValueChange(next ?? '')}>
      <SelectTrigger className="h-9.5 w-full bg-panel">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
