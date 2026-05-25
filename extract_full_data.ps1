# Full data extraction - map hyperlink IDs to text content from document.xml
[xml]$rels = Get-Content 'c:\Users\jites\Documents\Google Antigravity\Govtweb\docx_temp\word\_rels\document.xml.rels'
[xml]$doc = Get-Content 'c:\Users\jites\Documents\Google Antigravity\Govtweb\docx_temp\word\document.xml'

# Build a lookup table of rId -> URL
$urlMap = @{}
$rels.Relationships.Relationship | Where-Object { $_.Type -like '*hyperlink*' } | ForEach-Object {
    $urlMap[$_.Id] = $_.Target
}

# Define namespace manager
$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
$ns.AddNamespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")

# Find all hyperlink elements in the document
$hyperlinks = $doc.SelectNodes("//w:hyperlink", $ns)

Write-Output "Total hyperlink elements in document: $($hyperlinks.Count)"

# Build ordered list of title => URL mappings
$results = @()
$videoIndex = 0
$pdfIndex = 0

foreach ($hl in $hyperlinks) {
    $rId = $hl.GetAttribute("r:id")
    if (-not $rId) { continue }
    
    $url = $urlMap[$rId]
    if (-not $url) { continue }
    
    # Get the text content of the hyperlink
    $textNodes = $hl.SelectNodes(".//w:t", $ns)
    $text = ($textNodes | ForEach-Object { $_.InnerText }) -join ""
    $text = $text.Trim()
    
    if ($text -and $url) {
        $type = "other"
        if ($url -like '*brightcove*' -or $url -like '*m3u8*') { $type = "video"; $videoIndex++ }
        elseif ($url -like '*youtube*') { $type = "youtube"; $videoIndex++ }
        elseif ($url -like '*.pdf*') { $type = "pdf"; $pdfIndex++ }
        
        $results += [PSCustomObject]@{
            Index = $results.Count
            Title = $text
            Url = $url
            Type = $type
            RId = $rId
        }
    }
}

Write-Output "Total mapped entries: $($results.Count)"
Write-Output "Videos (brightcove): $(($results | Where-Object { $_.Type -eq 'video' }).Count)"
Write-Output "Videos (youtube): $(($results | Where-Object { $_.Type -eq 'youtube' }).Count)"
Write-Output "PDFs: $(($results | Where-Object { $_.Type -eq 'pdf' }).Count)"

Write-Output ""
Write-Output "=== FIRST 30 ENTRIES ==="
foreach ($r in ($results | Select-Object -First 30)) {
    Write-Output "[$($r.Type)] $($r.Title)"
}

Write-Output ""
Write-Output "=== ENTRIES 500-530 ==="
foreach ($r in ($results | Select-Object -Skip 500 -First 30)) {
    Write-Output "[$($r.Type)] $($r.Title)"
}

# Export as JSON for the website
$jsonOutput = $results | ConvertTo-Json -Depth 3
$jsonOutput | Out-File -FilePath 'c:\Users\jites\Documents\Google Antigravity\Govtweb\course_data.json' -Encoding UTF8

Write-Output ""
Write-Output "JSON data exported to course_data.json"
