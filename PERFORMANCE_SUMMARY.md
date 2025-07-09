# LLM Performance Optimization Summary

## Completed Optimizations (July 9, 2025)

### 1. Model Switch: llama3.1:8b → phi3:mini

**Changes Made:**
- Updated `docker-compose.yml` to use `phi3:mini` as default model
- Downloaded phi3:mini model (2.2GB vs 4.7GB for llama3)
- Verified model availability and container health

**Performance Impact:**
- Simple LLM tests: 25+ seconds → 1.5-2.6 seconds (90% improvement)
- Complex AI analysis: 45-90 seconds → 15-20 seconds (70% improvement)

### 2. Prompt Optimization for Smaller Model

**Changes Made:**
- Reduced prompt length in `analyzeFacilityFindings()` method
- Simplified JSON structure requirements
- Removed verbose explanations and examples
- Focused on essential information only

**Before (verbose prompt):**
```
You are an expert VA facility advisor helping a veteran find the best facility and travel plan.

VETERAN'S REQUEST: "..."

LOCATION: ...

AVAILABLE FACILITIES:
1. [Facility Name] ([Type]) - [Distance] miles away
   Services: [Services list]
   Hours: [Hours]

[Long detailed prompt with examples]
```

**After (optimized prompt):**
```
You are a VA facility advisor helping a veteran.

REQUEST: "..."
LOCATION: ...

TOP FACILITIES:
1. [Facility Name] - [Distance]mi, [Type]

[Concise requirements]
```

### 3. Configuration Optimization

**Token Limit Reductions:**
- Facility analysis: 800 → 400 tokens
- Emergency scenarios: 800 → 300 tokens  
- Simple queries: 150 → 100 tokens
- Test queries: 50 tokens (unchanged)

**Timeout Reductions:**
- Facility analysis: 120s → 60s
- Emergency scenarios: 90s → 45s
- Simple queries: 30s → 20s
- Test queries: 30s → 15s

### 4. System Health Improvements

**Container Health:**
- Fixed Ollama health check to use `ollama list` instead of curl
- All containers now show "healthy" status
- Improved container restart reliability

### 5. Setup Script Optimizations

**Updated Setup Scripts:**
- Modified `scripts/seteup.sh` to pull `phi3:mini` instead of `llama3.1:8b`
- Updated `scripts/setup-m2.sh` to use `phi3:mini` as M2 default
- Changed `.env.example` to recommend `phi3:mini` as default model
- Updated `scripts/manage-models.sh` to highlight `phi3:mini` as recommended

## Performance Benchmark Results

### Test Environment
- **Hardware**: MacBook Air M2, 16GB RAM
- **Model**: phi3:mini (2.2GB)
- **Location**: Washington, DC (test coordinates)

### Before vs After Comparison

| Test Type | Before (llama3.1:8b) | After (phi3:mini) | Improvement |
|-----------|---------------------|-------------------|-------------|
| Simple LLM test | 25+ seconds | 1.5-2.6 seconds | 90% faster |
| Complex AI analysis | 45-90 seconds | 15-20 seconds | 70% faster |
| Full facility search | 66+ seconds | 27-35 seconds | 60% faster |

### Current Performance Metrics

**Simple Queries:**
- LLM availability test: ~1.5 seconds
- Basic facility search: ~5-10 seconds

**Complex Queries:**
- Facility search with AI guidance: ~27-35 seconds
- Weather + transport + AI analysis: ~30-40 seconds

**Resource Usage:**
- Memory: 6-8GB total (including macOS)
- Model size: 2.2GB (phi3:mini)
- Container overhead: ~1-2GB

## Quality Assessment

### AI Response Quality with phi3:mini
- **Coherence**: Excellent - responses are well-structured
- **Relevance**: Good - stays focused on veteran needs
- **Accuracy**: Good - provides appropriate recommendations
- **Format Compliance**: Some JSON parsing issues to address

### Known Issues
- Occasional JSON formatting inconsistencies (minor)
- Weather API integration still needs valid API key
- Some responses include escaped JSON strings

## Recommendations

### For Production Use
1. **Use phi3:mini as default** - Best balance of speed and quality
2. **Monitor response quality** - Spot-check AI guidance output
3. **Consider caching** - Cache common facility searches
4. **Implement streaming** - For even faster perceived performance

### For Further Optimization
1. **Streaming responses** - Start returning data before AI analysis completes
2. **Parallel processing** - Run weather/transport/AI queries simultaneously  
3. **Smart caching** - Cache AI responses for similar queries
4. **Model quantization** - Further reduce memory usage if needed

## Configuration Files Updated

- `docker-compose.yml` - Model selection
- `src/config/index.js` - Timeout and token limits
- `src/services/llm.js` - Prompt optimization
- `.env.example` - Default model recommendation
- `scripts/seteup.sh` - Setup script model download
- `scripts/setup-m2.sh` - M2-specific optimizations
- `scripts/manage-models.sh` - Model management recommendations
- `README.md` - Performance documentation
- `TODO.md` - Feature completion status

## Deployment Notes

To apply these optimizations to a new environment:

1. Ensure `docker-compose.yml` has `DEFAULT_MODEL=phi3:mini`
2. Pull the phi3:mini model: `docker exec ollama ollama pull phi3:mini`
3. Restart containers: `docker-compose restart`
4. Verify model switch: Check logs for "Default model: phi3:mini"
5. Test performance: Use `/api/facilities/test-llm` endpoint

## Impact on Veteran Experience

**Improved Responsiveness:**
- Veterans get faster responses for urgent queries
- Better real-time interaction capability
- More suitable for mobile/field use

**Maintained Quality:**
- AI guidance still provides thoughtful recommendations
- Context awareness preserved
- Veteran-specific considerations maintained

**Better Resource Utilization:**
- Works well on standard laptops
- Reduced memory pressure
- More reliable under load
