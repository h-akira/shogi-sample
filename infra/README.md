# インフラストラクチャ

このディレクトリには、将棋盤サンプルアプリケーションを AWS にデプロイするための Terraform 設定が含まれています。

## アーキテクチャ

- **S3**: 静的ファイルストレージ (Vue アプリケーションのビルド成果物)
- **CloudFront**: CDN および HTTPS 配信 (OAC 経由で S3 にアクセス)
- **ACM**: カスタムドメイン用の SSL/TLS 証明書 (us-east-1 に事前作成が必要)

## Vue Router 対応

CloudFront は Vue Router の SPA ルーティングに対応するよう設定されています:
- 403/404 エラーを `index.html` にリダイレクト (200 ステータス)
- これにより `/play`, `/replay` などのルートが正常に動作します

## セットアップ

### 1. 前提条件

- AWS CLI がインストール・設定済み
- Terraform がインストール済み (`>= 1.0`)
- 適切な AWS 認証情報が設定済み
- ACM 証明書が **us-east-1 リージョン** に作成済み (CloudFront の要件)

### 2. 設定ファイルの作成

```bash
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` を編集してください:

```hcl
bucket_name         = "your-unique-bucket-name-here"
domain_name         = "shogi.example.com"
acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx"
aws_region          = "ap-northeast-1"
environment         = "dev"
```

### 3. Terraform の初期化と適用

```bash
terraform init
terraform plan
terraform apply
```

### 4. DNS 設定

Route 53 または他の DNS プロバイダーで、ドメイン名を CloudFront distribution の domain name に CNAME または ALIAS レコードとして設定してください:

```bash
terraform output cloudfront_domain_name  # CNAME / ALIAS 先
```

### 5. アプリケーションのデプロイ

プロジェクトルートからデプロイスクリプトを実行:

```bash
../deploy.sh
```

このスクリプトは以下を実行します:
1. Vue アプリケーションをビルド (`npm run build`)
2. `dist/` ディレクトリの内容を S3 にアップロード
3. CloudFront キャッシュを無効化

## 出力

```bash
terraform output cloudfront_url            # アプリケーションの URL
terraform output cloudfront_domain_name    # CloudFront ドメイン (DNS 設定用)
terraform output cloudfront_distribution_id
terraform output s3_bucket_name
```

## リソースの削除

```bash
# S3 バケットを空にする
aws s3 rm "s3://$(terraform output -raw s3_bucket_name)" --recursive

# Terraform リソースを削除
terraform destroy
```

## 注意事項

- S3 バケット名はグローバルに一意である必要があります
- CloudFront のデプロイには 10-15 分程度かかる場合があります
- キャッシュ無効化は即座に反映されない場合があります (最大 5 分程度)
