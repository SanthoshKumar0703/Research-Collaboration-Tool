import React, { useEffect, useRef, useState } from 'react';
import { Building2, Camera, GraduationCap, Mail, Plus, Save, Trash2, X } from 'lucide-react';
import { useSession } from '../lib/session';
import { useToast } from '../lib/toast';
import { Avatar, Badge, Field, PageHeader } from '../components/ui';
import { fmtDate } from '../lib/utils';
import { api, apiMode, absUrl } from '../lib/api';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export default function Profile() {
  const { session, setAvatar } = useSession();
  const toast = useToast();
  const fileRef = useRef(null);
  const live = apiMode();
  const [name, setName] = useState(session.name);
  const [bio, setBio] = useState('Working on early disease detection with deep learning. Interested in explainable AI and clinical validation.');
  const [dept, setDept] = useState('Data Science');
  const [institution, setInstitution] = useState('Coimbatore Institute of Technology');
  const [interests, setInterests] = useState(['Deep Learning', 'Medical Imaging', 'MLOps']);
  const [newInterest, setNewInterest] = useState('');
  const [joined, setJoined] = useState(null);

  useEffect(() => {
    if (!live) return;
    api('/api/users/me/profile')
      .then((u) => {
        if (u.name) setName(u.name);
        if (u.dept) setDept(u.dept);
        if (u.institution) setInstitution(u.institution);
        if (u.interests?.length) setInterests(u.interests);
        if (u.bio) setBio(u.bio);
        if (u.joined) setJoined(u.joined);
        if (u.avatar && u.avatar !== session.avatar) setAvatar(u.avatar ? absUrl(u.avatar) : null);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addInterest = () => {
    const v = newInterest.trim();
    if (!v || interests.includes(v)) return;
    setInterests((i) => [...i, v]);
    setNewInterest('');
  };

  const pickAvatar = () => fileRef.current?.click();

  const onAvatarFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file (PNG, JPG, WebP…).', 'err');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast('Image is too large — keep it under 2 MB.', 'err');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Crop to a square and downscale so the stored data-URL stays small
        const S = 320;
        const canvas = document.createElement('canvas');
        canvas.width = S;
        canvas.height = S;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(S / img.width, S / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (!live) {
          setAvatar(dataUrl);
          toast('Profile photo updated');
          return;
        }
        fetch(dataUrl)
          .then((r) => r.blob())
          .then((blob) => {
            const fd = new FormData();
            fd.append('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
            return api('/api/users/me/avatar', { method: 'POST', form: fd });
          })
          .then((r) => {
            setAvatar(absUrl(r.avatar));
            toast('Profile photo updated');
          })
          .catch((er) => toast(er.message || 'Could not upload the photo.', 'err'));
      };
      img.onerror = () => toast('Could not read that image — try another file.', 'err');
      img.src = reader.result;
    };
    reader.onerror = () => toast('Could not read that file.', 'err');
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    if (live) {
      api('/api/users/me/avatar', { method: 'DELETE' })
        .then(() => setAvatar(null))
        .catch(() => setAvatar(null));
    } else {
      setAvatar(null);
    }
    toast('Profile photo removed');
  };

  return (
    <div className="mx-auto max-w-[980px]">
      <PageHeader title="Profile" sub="How you appear to your research teams" />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card h-fit p-6 text-center">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFile} aria-label="Upload profile photo" />
          <div className="relative inline-block">
            <Avatar name={name} size={92} src={session.avatar} />
            <button
              onClick={pickAvatar}
              className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-wine text-[rgb(var(--c-on-accent))] shadow-soft transition hover:bg-wine-deep"
              aria-label="Upload profile photo"
              title="Upload photo"
            >
              <Camera size={14} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button className="btn-ghost px-3 py-1.5 text-[12px]" onClick={pickAvatar}>
              <Camera size={13} /> {session.avatar ? 'Change photo' : 'Upload photo'}
            </button>
            {session.avatar && (
              <button className="btn-ghost px-3 py-1.5 text-[12px] text-rust hover:bg-rust/10" onClick={removeAvatar}>
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">{name}</h2>
          <p className="text-[12.5px] text-faint">{session.email}</p>
          <div className="mt-3 flex justify-center">
            <Badge tone={session.role === 'supervisor' ? 'copper' : session.role === 'admin' ? 'wine' : 'neutral'}>
              {session.role === 'researcher' ? 'Researcher' : session.role === 'supervisor' ? 'Supervisor' : 'Administrator'}
            </Badge>
          </div>
          <div className="mt-5 space-y-2.5 border-t border-line pt-4 text-left">
            <div className="flex items-center gap-2.5 text-[12.5px] text-ink-2">
              <Building2 size={14} className="text-copper" /> {institution}
            </div>
            <div className="flex items-center gap-2.5 text-[12.5px] text-ink-2">
              <GraduationCap size={14} className="text-copper" /> Department of {dept}
            </div>
            <div className="flex items-center gap-2.5 text-[12.5px] text-ink-2">
              <Mail size={14} className="text-copper" /> {session.email}
            </div>
            <div className="text-[11px] text-faint">Member since {fmtDate(joined || new Date(Date.now() - 210 * 86400000).toISOString())}</div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div className="card p-6">
            <h3 className="mb-4 font-display text-[15.5px] font-semibold text-ink">Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Email" hint="Managed by your account security settings.">
                <input className="input opacity-60" value={session.email} disabled />
              </Field>
              <Field label="Department">
                <input className="input" value={dept} onChange={(e) => setDept(e.target.value)} />
              </Field>
              <Field label="Institution">
                <input className="input" value={institution} onChange={(e) => setInstitution(e.target.value)} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Bio">
                <textarea className="input min-h-[90px]" value={bio} onChange={(e) => setBio(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-1 font-display text-[15.5px] font-semibold text-ink">Research interests</h3>
            <p className="mb-4 text-[12.5px] text-faint">Shown to supervisors when they assign you to projects.</p>
            <div className="flex flex-wrap gap-2">
              {interests.map((i) => (
                <span key={i} className="chip py-1.5 text-[12px]">
                  {i}
                  <button onClick={() => setInterests((xs) => xs.filter((x) => x !== i))} className="text-faint transition hover:text-rust" aria-label={`Remove ${i}`}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="input flex-1"
                placeholder="Add an interest…"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addInterest()}
              />
              <button className="btn-soft" onClick={addInterest}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="btn-primary"
              onClick={() => {
                if (!live) return toast('Profile saved');
                api('/api/users/me/profile', {
                  method: 'PUT',
                  body: { name, dept, institution, interests, bio },
                })
                  .then(() => toast('Profile saved'))
                  .catch((er) => toast(er.message || 'Could not save your profile.', 'err'));
              }}
            >
              <Save size={15} /> Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
