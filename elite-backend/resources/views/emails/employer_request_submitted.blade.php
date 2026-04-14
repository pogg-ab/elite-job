<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Employer Request Submitted</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;background:#f6f9fc;margin:0;padding:0}
    .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.08)}
    .header{background:#0b6b3a;color:#fff;padding:20px}
    .content{padding:24px;color:#333}
    h1{margin:0 0 8px;font-size:20px}
    p{margin:8px 0}
    .jobs{margin-top:12px}
    .job{background:#f2f6f4;padding:10px;border-radius:6px;margin-bottom:8px}
    .footer{padding:16px;background:#fafafa;text-align:center;color:#666;font-size:13px}
    a.btn{display:inline-block;background:#0b6b3a;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Employer Request Submitted</h1>
    </div>
    <div class="content">
      <p><strong>Company:</strong> {{ $requestData->company_name ?? '—' }}</p>
      <p><strong>Contact person:</strong> {{ $requestData->contact_person ?? '—' }}</p>
      <p><strong>Email:</strong> {{ $requestData->email ?? '—' }}</p>
      <p><strong>Phone:</strong> {{ $requestData->phone ?? '—' }}</p>
      <p><strong>Country:</strong> {{ $requestData->country ?? '—' }}</p>

      <h3 style="margin-top:18px">Job requirements</h3>
      <div class="jobs">
        @foreach($requestData->jobRequirements ?? [] as $job)
          <div class="job">
            <strong>{{ $job->job_title }}</strong> — {{ $job->number_of_workers }} worker(s)
            @if(!empty($job->job_description))
              <div style="margin-top:6px;color:#555">{{ $job->job_description }}</div>
            @endif
          </div>
        @endforeach
      </div>

      @if(!empty($requestData->license_path))
        <p style="margin-top:12px">License: <a class="btn" href="{{ url('/storage/'.$requestData->license_path) }}">Download</a></p>
      @endif

      <p style="margin-top:18px">Thank you — we'll review your request and update you shortly.</p>
    </div>
    <div class="footer">If you have any questions, reply to this email.</div>
  </div>
</body>
</html>
