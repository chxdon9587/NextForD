# Supabase Storage 配置指南

## ⚠️ 必须配置才能使用图片上传功能

当前项目已实现图片上传功能，但需要在Supabase中配置Storage bucket。

## 📦 配置步骤（5分钟）

### 步骤1：创建Storage Bucket

1. 访问 https://supabase.com/dashboard/project/dxjybpwzbgvcwfobznam/storage/buckets
2. 点击 **"New bucket"**
3. 配置：
   - **Name:** `projects`
   - **Public bucket:** ✅ 勾选（允许公开访问）
   - **File size limit:** `5242880` (5MB)
   - **Allowed MIME types:** 留空（允许所有图片类型）
4. 点击 **"Create bucket"**

### 步骤2：配置RLS策略

在Supabase Dashboard中，进入 **Storage > Policies**，为`projects` bucket创建以下策略：

#### 策略1：允许认证用户上传
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'projects' AND
  (storage.foldername(name))[1] = 'project-images'
);
```

#### 策略2：允许公开读取
```sql
CREATE POLICY "Allow public to read project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'projects');
```

#### 策略3：允许用户删除自己的图片
```sql
CREATE POLICY "Allow users to delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'projects' AND
  owner_id = auth.uid()
);
```

### 步骤3：验证配置

在SQL Editor中运行：
```sql
SELECT * FROM storage.buckets WHERE name = 'projects';
```

应该看到：
- `name: projects`
- `public: true`
- `file_size_limit: 5242880`

## ✅ 配置完成后

图片上传功能将完全可用：

### 在项目创建中
1. 访问 `/create`
2. 在步骤1看到图片上传区域
3. 拖拽图片或点击上传
4. 图片自动上传到Supabase Storage
5. URL自动保存到项目数据

### 上传的图片会存储在
- **Bucket:** `projects`
- **路径:** `project-images/{userId}-{timestamp}.{ext}`
- **访问:** `https://dxjybpwzbgvcwfobznam.supabase.co/storage/v1/object/public/projects/project-images/...`

### 使用Next.js Image组件
```tsx
<Image
  src={project.image_url}
  alt={project.title}
  width={800}
  height={450}
  className="rounded-lg"
/>
```

next.config.ts已配置允许从Supabase加载图片。

## 🐛 故障排查

### 错误："Failed to upload image"
**原因：** Storage bucket不存在  
**解决：** 按上述步骤创建bucket

### 错误："new row violates row-level security policy"
**原因：** RLS策略未配置  
**解决：** 运行上述3个SQL策略

### 图片无法显示
**原因：** Bucket不是public  
**解决：** 确保bucket设置为public

### 文件太大
**原因：** 超过5MB限制  
**解决：** 压缩图片或调整file_size_limit

## 📚 代码参考

### 上传图片
```typescript
import { uploadProjectImage } from "@/app/actions/project";

const formData = new FormData();
formData.append("file", file);

const result = await uploadProjectImage(formData);
if (result.url) {
  // 图片URL可用
  console.log(result.url);
}
```

### 显示图片
```tsx
import Image from "next/image";

<Image
  src={project.image_url}
  alt={project.title}
  width={800}
  height={450}
/>
```

---

**配置完成后，图片上传将完全工作！** ✅
