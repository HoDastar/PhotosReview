package com.hodastar.photosreview.entities;

public class EntityReviewProj {
    public int id;
    public String name;
    public int type;
    public String task;
    public String thumbnail;
    public int status;
    public String time;
    public int display;

    public EntityReviewProj(int id, String name, int type, String task, String thumbnail, int status, String time, int display) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.task = task;
        this.thumbnail = thumbnail;
        this.status = status;
        this.time = time;
        this.display = display;
    }
}
