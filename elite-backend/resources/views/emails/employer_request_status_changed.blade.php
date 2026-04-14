<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Employer Request Status Updated</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;background:#f6f9fc;margin:0;padding:0}
    .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.08)}
    .header{background:#0b6b3a;color:#fff;padding:20px}
    .content{padding:24px;color:#333}
    h1{margin:0 0 8px;font-size:20px}
    .status{display:inline-block;background:#eef7ee;color:#0b6b3a;padding:6px 10px;border-radius:6px;font-weight:600}
    .jobs{margin-top:12px}
    .job{background:#f2f6f4;padding:10px;border-radius:6px;margin-bottom:8px}
    .footer{padding:16px;background:#fafafa;text-align:center;color:#666;font-size:13px}
    a.btn{display:inline-block;background:#0b6b3a;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Employer Request Status Updated</h1>
    </div>
    <div class="content">
      <p><strong>Company:</strong> {{ $requestData->company_name ?? '—' }}</p>
      <p><strong>Status:</strong> <span class="status">{{ $status }}</span></p>

      <h3 style="margin-top:18px">Job requirements</h3>
      <div class="jobs">
        @foreach($requestData->jobRequirements ?? [] as $job)
          <div class="job">
            <strong>{{ $job->job_title }}</strong> — {{ $job->number_of_workers }} worker(s)
          </div>
        @endforeach
      </div>

      @if(!empty($requestData->license_path))
        <p style="margin-top:12px">License: <a class="btn" href="{{ url('/storage/'.$requestData->license_path) }}">Download</a></p>
      @endif

      <p style="margin-top:18px">If you have questions, reply to this email.</p>
    </div>
    <div class="footer">Thank you — Hijra Global</div>
  </div>
</body>
</html>
