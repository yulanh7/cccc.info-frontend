This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



## 修改数据库的用户密码

1) 列出所有用户

docker exec -it cccc-backend sh -lc 'python - <<PY
from app import app, db
from website.models import User
with app.app_context():
    for u in User.query.order_by(User.id).all():
        print(u.id, u.email, u.first_name, u.admin, u.created_at)
PY'

2) 修改某个用户的密码（会做哈希）

docker exec -it cccc-backend sh -lc 'python - <<PY
from app import app, db
from website.models import User
from werkzeug.security import generate_password_hash
email = "rachelyl717@gmail.com"
new_pw = "NewPass123!"
with app.app_context():
    u = User.query.filter_by(email=email).first()
    if not u:
        print("User not found:", email)
    else:
        u.password = generate_password_hash(new_pw)
        db.session.commit()
        print("Password updated for:", u.email)
PY'


3) 修改user 为admin

docker exec -it cccc-backend sh -lc 'python - <<PY
from app import app, db
from website.models import User

email = "rachelyl717@gmail.com"   # ←换成目标用户的邮箱
with app.app_context():
    u = User.query.filter_by(email=email).first()
    if not u:
        print("User not found:", email)
    else:
        u.admin = True       # 设为管理员
        db.session.commit()
        print(f"{u.email} admin flag is now:", u.admin)
PY'
