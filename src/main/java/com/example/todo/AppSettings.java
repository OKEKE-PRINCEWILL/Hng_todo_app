package com.example.todo;

import jakarta.persistence.*;

@Entity
@Table(name = "app_settings")
public class AppSettings {
    @Id int id = 1;
    @Column(nullable = false) String timezone = "UTC";
}
