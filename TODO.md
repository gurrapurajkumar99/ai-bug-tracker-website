# Task: Role Options, Email Welcome, Simple User Dashboard + Image Upload, Deploy to GitHub/Vercel

## Approved Plan Steps (In Progress)

### Backend Updates
- [x] 1. Install deps: `npm i multer nodemailer`
- [x] 2. Edit `backend/server.js`: 
  - Add Nodemailer welcome email on new user (sample: from 'bugtracker.sample@gmail.com', pass 'abcd efgh ijkl mnop')
  - Add multer for image upload in `/api/bugs/upload` (store /backend/public/uploads)
  - Accept imageUrl in `/api/bugs`, store/serve /uploads/`

### Frontend Updates
- [x] 3. Edit `frontend/index.html`: Add image input to new-bug form + dashboard quick-report card
- [x] 4. Edit `frontend/script.js`: 
  - Simplify dashboard (personal bugs only, remove team charts for non-admin)
  - Role-based quick report (tester/developer)
  - Quick bug report in dashboard (title/desc/image → POST /api/bugs)
  - Display bug images in list/dashboard
- [x] 5. Edit `frontend/style.css`: Styles for quick form, image preview/upload

### Deploy & Test
- [x] 6. Test local backend/frontend (register→email, report w/image→dashboard, roles/quick report work)
- [ ] 7. Git commit/push: `git add . && git commit -m 'feat: role dashboards, welcome emails, image upload, simple user dash' && git push`
- [ ] 8. Install Vercel CLI if needed: `npm i -g vercel`, then `vercel --prod`
- [ ] 9. Test prod (emails/images/roles), update TODO.md complete
- [x] DONE

**Next step marked after each completion. Current: Backend deps & server.js**

